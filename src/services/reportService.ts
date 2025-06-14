import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { ReportData, ReportFilters, CarrefourStatus, TrafficAlert, MaintenanceTask } from '../types/traffic';

// Extension du type jsPDF pour inclure autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class ReportService {
  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  private static getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Actif',
      'warning': 'Attention',
      'error': 'Erreur',
      'offline': 'Hors ligne'
    };
    return labels[status] || status;
  }

  private static getAlertLabel(alertType: string): string {
    const labels: { [key: string]: string } = {
      'PORTE_OUVERTE': 'Porte Ouverte',
      'ALIMENTATION_COUPEE': 'Alimentation Coupée',
      'BATTERIE_FAIBLE': 'Batterie Faible',
      'TEMPERATURE_ELEVEE': 'Température Élevée',
      'PANNE_FEU': 'Panne de Feu',
      'TENSION_ANORMALE': 'Tension Anormale',
      'PANNE_INTERMITTENTE': 'Panne Intermittente',
      'SEQUENCE_BLOQUEE': 'Séquence Bloquée',
      'COMMUNICATION_PERDUE': 'Communication Perdue',
      'SURTENSION_DETECTEE': 'Surtension Détectée',
      'COURT_CIRCUIT': 'Court-Circuit'
    };
    return labels[alertType] || alertType.replace(/_/g, ' ');
  }

  static async generatePDFReport(data: ReportData, filters: ReportFilters): Promise<void> {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('Rapport de Supervision des Feux Tricolores', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Période: ${this.formatDate(filters.dateDebut)} - ${this.formatDate(filters.dateFin)}`, 20, 35);
    doc.text(`Généré le: ${this.formatDate(data.dateGeneration)}`, 20, 45);
    
    let yPosition = 60;

    // Statistiques générales
    if (filters.includeStatistiques) {
      doc.setFontSize(16);
      doc.text('Statistiques Générales', 20, yPosition);
      yPosition += 15;

      const stats = this.calculateStatistics(data);
      
      doc.autoTable({
        startY: yPosition,
        head: [['Métrique', 'Valeur']],
        body: [
          ['Total Carrefours', stats.totalCarrefours.toString()],
          ['Carrefours Actifs', stats.carrefoursActifs.toString()],
          ['Total Alertes', stats.totalAlertes.toString()],
          ['Alertes Critiques', stats.alertesCritiques.toString()],
          ['Tâches de Maintenance', stats.tachesMaintenance.toString()]
        ],
        margin: { left: 20 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // État des carrefours
    doc.setFontSize(16);
    doc.text('État des Carrefours', 20, yPosition);
    yPosition += 10;

    const carrefourData = data.carrefours.map(c => [
      c.name,
      c.location,
      this.getStatusLabel(c.status),
      c.measures?.esp_status.porte || 'N/A',
      c.measures?.esp_status.alimentation || 'N/A',
      c.alerts?.length.toString() || '0'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Nom', 'Localisation', 'État', 'Porte ESP', 'Alimentation', 'Alertes']],
      body: carrefourData,
      margin: { left: 20 },
      styles: { fontSize: 8 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Alertes
    if (data.alerts.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Alertes Actives', 20, 20);

      const alertData = data.alerts.map(a => [
        a.carrefour_id,
        this.getAlertLabel(a.type),
        a.poteau?.toString() || 'N/A',
        a.couleur || 'N/A',
        this.formatDate(a.timestamp)
      ]);

      doc.autoTable({
        startY: 35,
        head: [['Carrefour', 'Type', 'Poteau', 'Couleur', 'Date/Heure']],
        body: alertData,
        margin: { left: 20 },
        styles: { fontSize: 8 }
      });
    }

    // Maintenance
    if (filters.includeMaintenance && data.maintenanceTasks.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Tâches de Maintenance', 20, 20);

      const maintenanceData = data.maintenanceTasks.map(t => [
        t.carrefourName,
        `Poteau ${t.poteauNumber}`,
        t.couleurFeu,
        this.formatDate(t.dateMaintenance),
        t.chefMaintenanceNom,
        t.status
      ]);

      doc.autoTable({
        startY: 35,
        head: [['Carrefour', 'Poteau', 'Feu', 'Date Prévue', 'Responsable', 'État']],
        body: maintenanceData,
        margin: { left: 20 },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`rapport-feux-tricolores-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static async generateWordReport(data: ReportData, filters: ReportFilters): Promise<void> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Titre
          new Paragraph({
            children: [
              new TextRun({
                text: "Rapport de Supervision des Feux Tricolores",
                bold: true,
                size: 32
              })
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER
          }),
          
          // Informations générales
          new Paragraph({
            children: [
              new TextRun({
                text: `Période: ${this.formatDate(filters.dateDebut)} - ${this.formatDate(filters.dateFin)}`,
                size: 24
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Généré le: ${this.formatDate(data.dateGeneration)}`,
                size: 24
              })
            ]
          }),

          new Paragraph({ text: "" }), // Ligne vide

          // Statistiques
          ...(filters.includeStatistiques ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Statistiques Générales",
                  bold: true,
                  size: 28
                })
              ],
              heading: HeadingLevel.HEADING_1
            }),
            
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Métrique")] }),
                    new TableCell({ children: [new Paragraph("Valeur")] })
                  ]
                }),
                ...this.getStatisticsRows(data)
              ]
            })
          ] : []),

          // État des carrefours
          new Paragraph({
            children: [
              new TextRun({
                text: "État des Carrefours",
                bold: true,
                size: 28
              })
            ],
            heading: HeadingLevel.HEADING_1
          }),

          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Nom")] }),
                  new TableCell({ children: [new Paragraph("Localisation")] }),
                  new TableCell({ children: [new Paragraph("État")] }),
                  new TableCell({ children: [new Paragraph("Porte ESP")] }),
                  new TableCell({ children: [new Paragraph("Alimentation")] }),
                  new TableCell({ children: [new Paragraph("Alertes")] })
                ]
              }),
              ...data.carrefours.map(c => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(c.name)] }),
                  new TableCell({ children: [new Paragraph(c.location)] }),
                  new TableCell({ children: [new Paragraph(this.getStatusLabel(c.status))] }),
                  new TableCell({ children: [new Paragraph(c.measures?.esp_status.porte || 'N/A')] }),
                  new TableCell({ children: [new Paragraph(c.measures?.esp_status.alimentation || 'N/A')] }),
                  new TableCell({ children: [new Paragraph((c.alerts?.length || 0).toString())] })
                ]
              }))
            ]
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, `rapport-feux-tricolores-${new Date().toISOString().split('T')[0]}.docx`);
  }

  static generateCSVReport(data: ReportData, filters: ReportFilters): void {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // En-tête du rapport
    csvContent += `Rapport de Supervision des Feux Tricolores\n`;
    csvContent += `Période,${this.formatDate(filters.dateDebut)} - ${this.formatDate(filters.dateFin)}\n`;
    csvContent += `Généré le,${this.formatDate(data.dateGeneration)}\n\n`;

    // Statistiques
    if (filters.includeStatistiques) {
      csvContent += "STATISTIQUES GÉNÉRALES\n";
      const stats = this.calculateStatistics(data);
      csvContent += `Total Carrefours,${stats.totalCarrefours}\n`;
      csvContent += `Carrefours Actifs,${stats.carrefoursActifs}\n`;
      csvContent += `Total Alertes,${stats.totalAlertes}\n`;
      csvContent += `Alertes Critiques,${stats.alertesCritiques}\n`;
      csvContent += `Tâches de Maintenance,${stats.tachesMaintenance}\n\n`;
    }

    // État des carrefours
    csvContent += "ÉTAT DES CARREFOURS\n";
    csvContent += "Nom,Localisation,État,Porte ESP,Alimentation ESP,Batterie %,Température °C,Nombre Alertes\n";
    
    data.carrefours.forEach(c => {
      csvContent += `"${c.name}","${c.location}","${this.getStatusLabel(c.status)}",`;
      csvContent += `"${c.measures?.esp_status.porte || 'N/A'}",`;
      csvContent += `"${c.measures?.esp_status.alimentation || 'N/A'}",`;
      csvContent += `"${c.measures?.esp_status.batterie_niveau || 'N/A'}",`;
      csvContent += `"${c.measures?.esp_status.temperature || 'N/A'}",`;
      csvContent += `"${c.alerts?.length || 0}"\n`;
    });

    // Alertes
    if (data.alerts.length > 0) {
      csvContent += "\nALERTES ACTIVES\n";
      csvContent += "Carrefour,Type Alerte,Poteau,Couleur,Date/Heure,Programmée\n";
      
      data.alerts.forEach(a => {
        csvContent += `"${a.carrefour_id}","${this.getAlertLabel(a.type)}",`;
        csvContent += `"${a.poteau || 'N/A'}","${a.couleur || 'N/A'}",`;
        csvContent += `"${this.formatDate(a.timestamp)}","${a.isProgrammed ? 'Oui' : 'Non'}"\n`;
      });
    }

    // Maintenance
    if (filters.includeMaintenance && data.maintenanceTasks.length > 0) {
      csvContent += "\nTÂCHES DE MAINTENANCE\n";
      csvContent += "Carrefour,Poteau,Couleur Feu,Date Prévue,Responsable,Email,État\n";
      
      data.maintenanceTasks.forEach(t => {
        csvContent += `"${t.carrefourName}","Poteau ${t.poteauNumber}","${t.couleurFeu}",`;
        csvContent += `"${this.formatDate(t.dateMaintenance)}","${t.chefMaintenanceNom}",`;
        csvContent += `"${t.chefMaintenanceEmail}","${t.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport-feux-tricolores-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private static calculateStatistics(data: ReportData) {
    return {
      totalCarrefours: data.carrefours.length,
      carrefoursActifs: data.carrefours.filter(c => c.status === 'active').length,
      totalAlertes: data.alerts.length,
      alertesCritiques: data.alerts.filter(a => 
        a.type.includes('PANNE') || 
        a.type.includes('ERREUR') || 
        a.type === 'ALIMENTATION_COUPEE'
      ).length,
      tachesMaintenance: data.maintenanceTasks.length
    };
  }

  private static getStatisticsRows(data: ReportData) {
    const stats = this.calculateStatistics(data);
    return [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Total Carrefours")] }),
          new TableCell({ children: [new Paragraph(stats.totalCarrefours.toString())] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Carrefours Actifs")] }),
          new TableCell({ children: [new Paragraph(stats.carrefoursActifs.toString())] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Total Alertes")] }),
          new TableCell({ children: [new Paragraph(stats.totalAlertes.toString())] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Alertes Critiques")] }),
          new TableCell({ children: [new Paragraph(stats.alertesCritiques.toString())] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Tâches de Maintenance")] }),
          new TableCell({ children: [new Paragraph(stats.tachesMaintenance.toString())] })
        ]
      })
    ];
  }
}