# Email Automation Module
# Add this code to your app.py file

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from config import DevelopmentConfig, ProductionConfig

env = os.getenv("APP_ENV", "development").lower()
if env == "production":
    app_config = ProductionConfig()
else:
    app_config = DevelopmentConfig()

EMAIL_CONFIG = app_config.EMAIL_CONFIG

def send_rejection_email(candidate_name, candidate_email, position):
    """Send a professional rejection email to the candidate"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{EMAIL_CONFIG['SENDER_NAME']} <{EMAIL_CONFIG['SENDER_EMAIL']}>"
        msg['To'] = candidate_email
        msg['Subject'] = f"Application Update - {position}"
        
        # HTML email body
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Application Status Update</h2>
                    
                    <p>Dear {candidate_name},</p>
                    
                    <p>Thank you for your interest in the <strong>{position}</strong> position at our organization and for taking the time to go through our recruitment process.</p>
                    
                    <p>After careful consideration of your application and qualifications, we regret to inform you that we have decided to move forward with other candidates whose experience and skills more closely match our current requirements.</p>
                    
                    <p>We truly appreciate the time and effort you invested in applying for this position. Your credentials are impressive, and we encourage you to apply for future openings that match your qualifications.</p>
                    
                    <p>We wish you all the best in your job search and future professional endeavors.</p>
                    
                    <p>Best regards,<br>
                    <strong>{EMAIL_CONFIG['SENDER_NAME']}</strong></p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Plain text version as fallback
        text_body = f"""
Dear {candidate_name},

Thank you for your interest in the {position} position at our organization and for taking the time to go through our recruitment process.

After careful consideration of your application and qualifications, we regret to inform you that we have decided to move forward with other candidates whose experience and skills more closely match our current requirements.

We truly appreciate the time and effort you invested in applying for this position. Your credentials are impressive, and we encourage you to apply for future openings that match your qualifications.

We wish you all the best in your job search and future professional endeavors.

Best regards,
{EMAIL_CONFIG['SENDER_NAME']}

---
This is an automated message. Please do not reply to this email.
        """
        
        # Attach both versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(EMAIL_CONFIG['SMTP_SERVER'], EMAIL_CONFIG['SMTP_PORT']) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['SENDER_EMAIL'], EMAIL_CONFIG['SENDER_PASSWORD'])
            server.send_message(msg)
        
        print(f"✅ Rejection email sent to {candidate_email}")
        return True, "Email sent successfully"
    
    except Exception as e:
        print(f"❌ Error sending email: {str(e)}")
        return False, str(e)


# API Endpoint - Add this with your other routes
@app.route('/api/send-rejection-email', methods=['POST'])
@login_required
def send_rejection_email_api():
    """API endpoint to send rejection email"""
    try:
        data = request.json
        candidate_name = data.get('name', 'Candidate')
        candidate_email = data.get('email')
        position = data.get('position', 'the position')
        
        if not candidate_email:
            return jsonify({
                "status": "error",
                "message": "Candidate email is required"
            }), 400
        
        # Send the email
        success, message = send_rejection_email(candidate_name, candidate_email, position)
        
        if success:
            return jsonify({
                "status": "success",
                "message": "Rejection email sent successfully"
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"Failed to send email: {message}"
            }), 500
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
