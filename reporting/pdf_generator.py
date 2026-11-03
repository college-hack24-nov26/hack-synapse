"""Print-ready NeuroGlove session reports with embedded fonts and vector charts."""
import math
import re
import threading
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.graphics.shapes import Drawing, Line, String, PolyLine, Circle, Rect
import config

LOCK = threading.RLock()
INK = colors.HexColor('#344f65')
MUTED = colors.HexColor('#8396a5')
BLUE = colors.HexColor('#668ba8')
BORDER = colors.HexColor('#e2eaf0')
PALE = colors.HexColor('#f5f8fb')
WIDTH = A4[0] - 84


def fonts():
    folder = Path(__file__).parent / 'fonts'
    if 'NG-Regular' not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont('NG-Regular', str(folder / 'Poppins-Regular.ttf')))
        pdfmetrics.registerFont(TTFont('NG-Medium', str(folder / 'Poppins-Medium.ttf')))
        pdfmetrics.registerFontFamily('NG-Regular', normal='NG-Regular', bold='NG-Medium', italic='NG-Regular', boldItalic='NG-Medium')


def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def metric(value, digits=0, suffix=''):
    return f'{value:.{digits}f}{suffix}' if numeric(value) else '-'


def text(value):
    value = str(value if value is not None else '-')
    for dash in ('\u2010', '\u2011', '\u2012', '\u2013', '\u2014', '\u2212'):
        value = value.replace(dash, '-')
    return escape(value).replace('\n', '<br/>')


def date_label(value):
    try:
        parsed = datetime.fromisoformat(str(value))
        return parsed.strftime('%d %b %Y'), parsed.strftime('%I:%M %p').lstrip('0')
    except (ValueError, TypeError):
        return '-', '-'


def paragraph(value, size=9, color=INK, medium=False, leading=None):
    return Paragraph(value, ParagraphStyle('ng', fontName='NG-Medium' if medium else 'NG-Regular',
        fontSize=size, leading=leading or size*1.55, textColor=color, spaceAfter=0))


def section(title, detail=None):
    items = [Spacer(1, 19), paragraph(text(title), 11, medium=True)]
    if detail: items += [Spacer(1, 3), paragraph(text(detail), 7.5, MUTED)]
    items += [Spacer(1, 10)]
    return items


def chart(reps, field, title, unit, xoffset=0):
    w, h = 242, 159
    drawing = Drawing(w, h)
    drawing.add(String(0, h-12, title, fontName='NG-Medium', fontSize=8, fillColor=INK))
    points = [(r.get('rep_number'), r.get(field)) for r in reps if numeric(r.get('rep_number')) and numeric(r.get(field))]
    if not points:
        drawing.add(String(20, 65, 'No repetition measurements available', fontName='NG-Regular', fontSize=7, fillColor=MUTED))
        return drawing
    left, bottom, right, top = 30, 31, 231, 124
    maximum = 100 if unit == '%' else max(1, math.ceil(max(max(0, v) for _,v in points)*1.15))
    for n in range(5):
        value=maximum*n/4; y=bottom+(top-bottom)*n/4
        drawing.add(Line(left,y,right,y,strokeColor=BORDER,strokeWidth=.45))
        label=f'{value:g}'+('%' if unit=='%' else '')
        drawing.add(String(left-6,y-2.5,label,fontName='NG-Regular',fontSize=6,textAnchor='end',fillColor=MUTED))
    lo,hi=min(x for x,_ in points),max(x for x,_ in points)
    def xcoord(value):return (left+right)/2 if lo==hi else left+(value-lo)/(hi-lo)*(right-left)
    coords=[]
    for x,y in points:coords.extend([xcoord(x), bottom+max(0,min(maximum,y))/maximum*(top-bottom)])
    if len(points)>1:drawing.add(PolyLine(coords,strokeColor=BLUE,strokeWidth=1.6))
    for x,y in zip(coords[::2],coords[1::2]):drawing.add(Circle(x,y,2.3,fillColor=BLUE,strokeColor=colors.white,strokeWidth=.7))
    for value in sorted({lo,points[len(points)//2][0],hi}):
        drawing.add(String(xcoord(value),17,str(int(value)),fontName='NG-Regular',fontSize=6.5,textAnchor='middle',fillColor=MUTED))
    drawing.add(String((left+right)/2,2,'Repetition',fontName='NG-Regular',fontSize=6.5,textAnchor='middle',fillColor=MUTED))
    return drawing


def footer(canvas, doc):
    canvas.saveState()
    width,height=A4
    logo=config.BASE_DIR/'web/static/images/neuroglove-logo-five-fingers.png'
    if logo.exists():canvas.drawImage(str(logo),42,height-48,width=17,height=24,preserveAspectRatio=True,mask='auto')
    canvas.setFillColor(INK);canvas.setFont('NG-Medium',12);canvas.drawString(67,height-40,'NeuroGlove')
    canvas.setFont('NG-Regular',7);canvas.setFillColor(MUTED);canvas.drawRightString(width-42,height-39,'SESSION REPORT')
    canvas.setStrokeColor(BORDER);canvas.setLineWidth(.6);canvas.line(42,43,width-42,43)
    canvas.setFont('NG-Regular',6.5);canvas.drawString(42,29,'NeuroGlove | Personal movement record')
    canvas.drawRightString(width-42,29,f'Page {doc.page}')
    canvas.restoreState()


def generate_pdf_report(session_data):
    """Generate every download from stored data; never infer unavailable results."""
    with LOCK:
        fonts()
        session_id=session_data.get('id',0)
        safe_id=re.sub(r'[^a-zA-Z0-9_-]','',str(session_id)) or '0'
        path=config.REPORTS_DIR/f'neuroglove_session_{safe_id}_report.pdf'
        path.parent.mkdir(parents=True,exist_ok=True)
        doc=SimpleDocTemplate(str(path),pagesize=A4,leftMargin=42,rightMargin=42,topMargin=73,bottomMargin=58,
            title=f'NeuroGlove - Session {safe_id}',author='NeuroGlove')
        raw_name=str(session_data.get('exercise_name') or 'Hand movement')
        simulated=raw_name.lower().startswith('simulated') or session_data.get('data_source')=='simulate'
        name=re.sub(r'^Simulated\s*[·:-]\s*','',raw_name,flags=re.I)
        start_day,start_time=date_label(session_data.get('start_time'))
        reps=session_data.get('repetitions') or []
        story=[paragraph('YOUR SESSION AT A GLANCE',8,MUTED),Spacer(1,7),paragraph(text(name),23,medium=True,leading=31),Spacer(1,8),
            paragraph(f'Session #{text(session_id)} &nbsp; / &nbsp; {text(start_day)} &nbsp; / &nbsp; {text(start_time)}',8,MUTED)]
        if simulated:story += [Spacer(1,8),paragraph('SIMULATED SESSION',7,BLUE,medium=True)]
        story+= [Spacer(1,20)]
        info=Table([[paragraph('PARTICIPANT',7,MUTED),paragraph('USER CODE',7,MUTED),paragraph('HAND',7,MUTED)],
            [paragraph(text(session_data.get('user_name') or 'Not recorded'),10,medium=True),paragraph(text(session_data.get('user_code') or 'Not recorded'),10),paragraph(text(session_data.get('affected_hand') or 'Not recorded'),10)]],colWidths=[WIDTH*.48,WIDTH*.29,WIDTH*.23])
        info.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,0),5),('BOTTOMPADDING',(0,1),(-1,1),14),('LINEBELOW',(0,1),(-1,1),.6,BORDER)]))
        story.append(info)
        story+=section('Session summary')
        labels=['Completed reps','Average rep','Average range','Consistency']
        values=[metric(session_data.get('total_repetitions')),metric(session_data.get('avg_duration_sec'),1,' s'),metric(session_data.get('avg_rom_percentage'),1,'%'),metric(session_data.get('consistency_score'),1,'%')]
        cards=[]
        for label,value in zip(labels,values):
            cards.append([paragraph(label,7.5,MUTED),Spacer(1,8),paragraph(value,22,INK,True)])
        metrics=Table([cards],colWidths=[WIDTH/4]*4)
        metrics.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),13),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),15),('LINEAFTER',(0,0),(2,0),.8,colors.white)]))
        story.append(metrics)
        story+=section('Movement across repetitions','Recorded range and movement time for each completed repetition.')
        plots=Table([[chart(reps,'peak_rom','Range of motion (%)','%'),chart(reps,'duration_sec','Movement time (seconds)','s')]],colWidths=[WIDTH/2]*2)
        plots.setStyle(TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('VALIGN',(0,0),(-1,-1),'TOP')]))
        story.append(plots)
        # Activation labels are included only when supported by recorded attempts.
        measured=any(str(r.get('attempt_status','')).upper() in ('ACTIVE','ACTIVE_ATTEMPT','PASSIVE','PASSIVE_MOVEMENT','ATTEMPT_NO_MOTION') for r in reps)
        if measured:
            story+=section('Recorded attempt classifications')
            parts=[('Active attempts','active_attempts_count'),('Passive movements','passive_movements_count'),('Without motion','attempt_no_motion_count'),('Uncertain','uncertain_count')]
            rows=[[paragraph(text(label),7,MUTED) for label,_ in parts],[paragraph(metric(session_data.get(key)),11,medium=True) for _,key in parts]]
            table=Table(rows,colWidths=[WIDTH/4]*4);table.setStyle(TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),5)]));story.append(table)
        notes=session_data.get('notes')
        if notes:
            story+=section('Session notes');story.append(paragraph(text(notes),8))
        story += [Spacer(1,18),paragraph('Percentages describe recorded sensor movement. This report is a session record, not a clinical diagnosis.',6.5,MUTED)]
        if reps:
            story += [PageBreak(),paragraph('REPETITION DETAIL',8,MUTED),Spacer(1,7),paragraph('Every recorded movement',20,medium=True),Spacer(1,7),paragraph(f'Session #{text(session_id)} / {len(reps)} recorded repetitions',8,MUTED),Spacer(1,18)]
            headers=['Rep','Time','Peak range','Movement','Attempt','Consistency']
            widths=[WIDTH*.07,WIDTH*.12,WIDTH*.14,WIDTH*.21,WIDTH*.28,WIDTH*.18]
            rows=[[paragraph(h,7,MUTED,True) for h in headers]]
            for r in reps:
                attempt=str(r.get('attempt_status') or 'Not recorded').replace('_',' ').title()
                row=[f"#{r.get('rep_number','-')}",metric(r.get('duration_sec'),2,' s'),metric(r.get('peak_rom'),1,'%'),str(r.get('movement_class') or '-').replace('_',' ').title(),attempt,metric(r.get('consistency_score'),1,'%')]
                rows.append([paragraph(text(value),7) for value in row])
            table=Table(rows,colWidths=widths,repeatRows=1,hAlign='LEFT')
            table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),PALE),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#fbfcfd')]),('LINEBELOW',(0,0),(-1,0),.6,BORDER),('LINEBELOW',(0,1),(-1,-1),.35,BORDER),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
            story.append(table)
        doc.build(story,onFirstPage=footer,onLaterPages=footer)
        return path
