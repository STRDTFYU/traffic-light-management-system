import { EmailConfig } from '../types/traffic';

const EMAIL_CONFIG: EmailConfig = {
  senderEmail: 'systemededetectionautomatique@gmail.com',
  senderPassword: 'wvdp iayq cyce njuq',
  adminEmail: 'guigonoucalebgodwin@gmail.com'
};

export class EmailService {
  private static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      // Simulation d'envoi d'email - En production, utiliser un service comme EmailJS ou une API backend
      console.log('📧 Email envoyé:', {
        from: EMAIL_CONFIG.senderEmail,
        to,
        subject,
        body
      });
      
      // Simulation d'un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return false;
    }
  }

  static async sendAlertNotification(alertType: string, carrefourId: string, details: string): Promise<boolean> {
    const subject = `🚨 ALERTE SYSTÈME - ${alertType} - ${carrefourId}`;
    const body = `
      Une nouvelle alerte a été détectée sur le système de supervision des feux de circulation.
      
      Détails de l'alerte:
      - Type: ${alertType}
      - Carrefour: ${carrefourId}
      - Heure: ${new Date().toLocaleString('fr-FR')}
      - Détails: ${details}
      
      Veuillez vérifier le système de supervision pour plus d'informations.
      
      Système de Détection Automatique
    `;

    return await this.sendEmail(EMAIL_CONFIG.adminEmail, subject, body);
  }

  static async sendMaintenanceNotification(
    chefEmail: string,
    chefNom: string,
    carrefourName: string,
    dateMaintenance: string,
    details: string
  ): Promise<boolean> {
    const subject = `🔧 PROGRAMMATION MAINTENANCE - ${carrefourName}`;
    const body = `
      Bonjour ${chefNom},
      
      Une maintenance a été programmée pour votre équipe.
      
      Détails de la maintenance:
      - Carrefour: ${carrefourName}
      - Date programmée: ${new Date(dateMaintenance).toLocaleString('fr-FR')}
      - Détails: ${details}
      
      Veuillez vous connecter au système de supervision pour consulter tous les détails.
      
      Cordialement,
      Système de Détection Automatique
    `;

    return await this.sendEmail(chefEmail, subject, body);
  }
}