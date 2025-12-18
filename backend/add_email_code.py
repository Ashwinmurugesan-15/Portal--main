import re

# Read the file
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports after line 12
imports_to_add = """import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
"""

# Find the position after "import hashlib"
content = content.replace(
    "import hashlib\n",
    f"import hashlib\n{imports_to_add}"
)

# 2. Add EMAIL_CONFIG after USER_DB
email_config = """
# Email Configuration
EMAIL_CONFIG = {
    'SMTP_SERVER': 'smtp.gmail.com',
    'SMTP_PORT': 587,
    'SENDER_EMAIL': 'jagadeesh19ct11@gmail.com',
    'SENDER_PASSWORD': 'lwda firu drjp ajiy',
    'SENDER_NAME': 'HR Recruitment Team'
}
"""

content = content.replace(
    "USER_DB = 'instance/users.db'\n",
    f"USER_DB = 'instance/users.db'\n{email_config}"
)

# 3. Add send_rejection_email function after is_admin()
email_function = """

# Send rejection email
def send_rejection_email(candidate_name, candidate_email, position):
    \"\"\"Send a professional rejection email to the candidate\"\"\"
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{EMAIL_CONFIG['SENDER_NAME']} <{EMAIL_CONFIG['SENDER_EMAIL']}>"
        msg['To'] = candidate_email
        msg['Subject'] = f"Application Update - {position}"
        
        # HTML email body
        html_body = f\"\"\"
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Application Status Update</h2>
                    
                    <p>Dear {candidate_name},</p>
                    
                    <p>Thank you for your interest in the <strong>{position}</strong> position at our organization.</p>
                    
                    <p>After careful consideration, we regret to inform you that we have decided to move forward with other candidates.</p>
                    
                    <p>We appreciate your time and encourage you to apply for future openings.</p>
                    
                    <p>Best regards,<br>
                    <strong>{EMAIL_CONFIG['SENDER_NAME']}</strong></p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">
                        This is an automated message.
                    </p>
                </div>
            </body>
        </html>
        \"\"\"
        
        # Plain text version
        text_body = f\"\"\"
Dear {candidate_name},

Thank you for your interest in the {position} position.

After careful consideration, we regret to inform you that we have decided to move forward with other candidates.

We appreciate your time and encourage you to apply for future openings.

Best regards,
{EMAIL_CONFIG['SENDER_NAME']}
        \"\"\"
        
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
"""

content = content.replace(
    "def is_admin():\n    \"\"\"Check if the current user is an admin\"\"\"\n    return session.get('is_admin', False)\n",
    f"def is_admin():\n    \"\"\"Check if the current user is an admin\"\"\"\n    return session.get('is_admin', False)\n{email_function}"
)

# 4. Add API endpoint before if __name__ == '__main__':
api_endpoint = """
@app.route('/api/send-rejection-email', methods=['POST'])
@login_required
def send_rejection_email_api():
    \"\"\"API endpoint to send rejection email\"\"\"
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

"""

content = content.replace(
    "if __name__ == '__main__':",
    f"{api_endpoint}if __name__ == '__main__':"
)

# Write back
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully added email automation code to app.py!")
print("✅ Email configuration added")
print("✅ send_rejection_email() function added")
print("✅ /api/send-rejection-email endpoint added")
