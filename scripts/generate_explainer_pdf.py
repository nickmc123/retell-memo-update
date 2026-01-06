#!/usr/bin/env python3
"""
TravelBucks Activation Explainer PDF Generator

Generates a one-page PDF and Markdown explainer document for the
"Choose Your Dream Getaway — from $999" promotional package.

Usage:
    python scripts/generate_explainer_pdf.py

Output:
    - assets/TravelBucks_Activation_Explainer.pdf
    - assets/TravelBucks_Activation_Explainer.md

Requirements:
    pip install reportlab
"""

import os
from datetime import datetime

# Try to import reportlab, provide helpful message if not installed
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, ListFlowable, ListItem
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
except ImportError:
    print("Error: reportlab is not installed.")
    print("Install it with: pip install reportlab")
    exit(1)


# =============================================================================
# CONTENT
# =============================================================================

CONTENT = {
    "title": "TravelBucks Activation Package",
    "subtitle": "Choose Your Dream Getaway — from $999",
    "activation_price": "$999",

    "intro": """Thank you for activating your TravelBucks promotional travel package!
This document explains what's included in your package and what to expect next.""",

    "whats_included": [
        ("Your Choice of Primary Vacation",
         "Select ONE destination from our available options: Hawaii, Cancun, Las Vegas, Orlando, Caribbean Cruises, or Domestic Airfare promotions."),
        ("Bonus 2-Night Hotel Stay",
         "Receive a complimentary 2-night hotel stay at participating properties. Redeemed separately from your primary vacation."),
        ("$100 Promotional Dining Credit",
         "Enjoy $100 in dining credits at select restaurants and venues. Certificate/credit terms apply; redeemed separately."),
    ],

    "destinations": [
        "Hawaii (Oahu, Maui, Big Island)",
        "Cancun & Riviera Maya, Mexico",
        "Las Vegas, Nevada",
        "Orlando, Florida",
        "Caribbean Cruises",
        "Domestic Airfare Promotions",
    ],

    "next_steps": [
        "A travel specialist will contact you within 24-48 hours",
        "Discuss your preferred travel dates and destination details",
        "Receive your booking confirmation and travel documents",
        "Enjoy your vacation!",
    ],

    "disclosures": [
        "The $999 activation price applies to one selected promotional travel package.",
        "Final travel dates, departure cities/ports, and inclusions vary by destination.",
        "Taxes, fees, and optional upgrades may apply and are not included in the activation price.",
        "Bonus items (hotel stay, dining credit) are redeemed separately and subject to their own terms and conditions.",
        "Travel must be completed within the validity period specified in your package documents.",
        "Blackout dates may apply during peak travel seasons and holidays.",
        "All travel is subject to availability at time of booking.",
    ],

    "support": {
        "email": "support@travelbucks.com",
        "phone": "1-800-XXX-XXXX",
        "hours": "Monday-Friday, 9 AM - 6 PM EST",
    },

    "footer": "© 2025 TravelBucks. All rights reserved.",
}


# =============================================================================
# PDF GENERATION
# =============================================================================

def generate_pdf(output_path: str):
    """Generate the one-page PDF explainer."""

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    # Styles
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2c5282'),
        alignment=TA_CENTER,
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#4a5568'),
        alignment=TA_CENTER,
        spaceAfter=20,
    )

    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2d3748'),
        spaceBefore=15,
        spaceAfter=8,
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4a5568'),
        alignment=TA_JUSTIFY,
        spaceAfter=8,
        leading=14,
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4a5568'),
        leftIndent=20,
        spaceAfter=4,
        leading=13,
    )

    small_style = ParagraphStyle(
        'Small',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#718096'),
        alignment=TA_LEFT,
        spaceAfter=3,
        leading=10,
    )

    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#a0aec0'),
        alignment=TA_CENTER,
        spaceBefore=20,
    )

    # Build content
    story = []

    # Title
    story.append(Paragraph(CONTENT["title"], title_style))
    story.append(Paragraph(CONTENT["subtitle"], subtitle_style))

    # Divider
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0')))
    story.append(Spacer(1, 10))

    # Intro
    story.append(Paragraph(CONTENT["intro"], body_style))

    # What's Included
    story.append(Paragraph("What's Included", heading_style))

    for title, desc in CONTENT["whats_included"]:
        story.append(Paragraph(f"<b>• {title}</b>", bullet_style))
        story.append(Paragraph(f"  {desc}", bullet_style))

    # Available Destinations
    story.append(Paragraph("Available Destinations", heading_style))

    # Create a 2-column table for destinations
    dest_data = []
    dests = CONTENT["destinations"]
    for i in range(0, len(dests), 2):
        row = [f"• {dests[i]}"]
        if i + 1 < len(dests):
            row.append(f"• {dests[i+1]}")
        else:
            row.append("")
        dest_data.append(row)

    dest_table = Table(dest_data, colWidths=[3.25*inch, 3.25*inch])
    dest_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#4a5568')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(dest_table)

    # What Happens Next
    story.append(Paragraph("What Happens Next", heading_style))

    for i, step in enumerate(CONTENT["next_steps"], 1):
        story.append(Paragraph(f"<b>{i}.</b> {step}", bullet_style))

    # Important Information
    story.append(Paragraph("Important Information", heading_style))

    for disclosure in CONTENT["disclosures"]:
        story.append(Paragraph(f"• {disclosure}", small_style))

    # Support Contact
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0')))

    support = CONTENT["support"]
    support_text = f"""<b>Questions?</b> Contact our support team:<br/>
Email: {support['email']} | Phone: {support['phone']}<br/>
{support['hours']}"""

    story.append(Spacer(1, 8))
    story.append(Paragraph(support_text, small_style))

    # Footer
    story.append(Paragraph(CONTENT["footer"], footer_style))

    # Build PDF
    doc.build(story)
    print(f"✅ PDF generated: {output_path}")


# =============================================================================
# MARKDOWN GENERATION
# =============================================================================

def generate_markdown(output_path: str):
    """Generate the Markdown version of the explainer."""

    md = []

    # Title
    md.append(f"# {CONTENT['title']}")
    md.append(f"## {CONTENT['subtitle']}")
    md.append("")
    md.append("---")
    md.append("")

    # Intro
    md.append(CONTENT["intro"].replace("\n", " "))
    md.append("")

    # What's Included
    md.append("## What's Included")
    md.append("")

    for title, desc in CONTENT["whats_included"]:
        md.append(f"### {title}")
        md.append(desc)
        md.append("")

    # Destinations
    md.append("## Available Destinations")
    md.append("")
    for dest in CONTENT["destinations"]:
        md.append(f"- {dest}")
    md.append("")

    # Next Steps
    md.append("## What Happens Next")
    md.append("")
    for i, step in enumerate(CONTENT["next_steps"], 1):
        md.append(f"{i}. {step}")
    md.append("")

    # Disclosures
    md.append("## Important Information")
    md.append("")
    for disclosure in CONTENT["disclosures"]:
        md.append(f"- {disclosure}")
    md.append("")

    # Support
    md.append("---")
    md.append("")
    md.append("## Questions?")
    md.append("")
    support = CONTENT["support"]
    md.append(f"Contact our support team:")
    md.append(f"- **Email:** {support['email']}")
    md.append(f"- **Phone:** {support['phone']}")
    md.append(f"- **Hours:** {support['hours']}")
    md.append("")

    # Footer
    md.append("---")
    md.append("")
    md.append(f"*{CONTENT['footer']}*")
    md.append("")

    # Write file
    with open(output_path, 'w') as f:
        f.write('\n'.join(md))

    print(f"✅ Markdown generated: {output_path}")


# =============================================================================
# MAIN
# =============================================================================

def main():
    # Ensure assets directory exists
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    assets_dir = os.path.join(project_root, 'assets')

    os.makedirs(assets_dir, exist_ok=True)

    # Generate files
    pdf_path = os.path.join(assets_dir, 'TravelBucks_Activation_Explainer.pdf')
    md_path = os.path.join(assets_dir, 'TravelBucks_Activation_Explainer.md')

    print("Generating TravelBucks Activation Explainer...")
    print("")

    generate_pdf(pdf_path)
    generate_markdown(md_path)

    print("")
    print("Done! Files generated in assets/ directory.")


if __name__ == "__main__":
    main()
