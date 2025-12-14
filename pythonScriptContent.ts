

export const PYTHON_SCRIPT = `#!/usr/bin/env python3
"""
Wrike Project Report Generator - Exact Layout Match
Generates a PDF dashboard matching the specified design layout
"""

import requests
import json
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter, landscape, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.colors import HexColor, white, black
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from io import BytesIO

class WrikeReportGenerator:
    def __init__(self, api_token):
        """Initialize with Wrike API token"""
        self.api_token = api_token
        self.base_url = "https://www.wrike.com/api/v4"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        
        # Spaces to include in the report
        self.target_spaces = [
            "DECOE Animation",
            "DECOE Digital Graphics", 
            "DECOE Email Marketing",
            "DECOE Uncategorized",
            "Photography"
        ]
        
        # Brands to track
        self.brands = [
            "GEARWRENCH",
            "Crescent",
            "Weller",
            "Cleco",
            "SATA"
        ]

        # Cache for Custom Fields
        self.custom_field_map = {}
        self.fetch_custom_fields_def()
        
    def fetch_custom_fields_def(self):
        """Fetch all custom fields to map ID to Title and options"""
        try:
            response = requests.get(
                f"{self.base_url}/customfields",
                headers=self.headers
            )
            if response.status_code == 200:
                data = response.json().get('data', [])
                for cf in data:
                    # Store title, type, and map dropdown options if available
                    options_map = {}
                    if 'settings' in cf and 'options' in cf['settings']:
                        for opt in cf['settings']['options']:
                            options_map[opt['id']] = opt['value']
                            
                    self.custom_field_map[cf['id']] = {
                        'title': cf['title'],
                        'type': cf['type'],
                        'options': options_map
                    }
        except Exception as e:
            print(f"Error fetching custom fields: {e}")

    def extract_brand(self, project_name):
        """Extract brand name from project title"""
        name_upper = project_name.upper()
        
        if name_upper.startswith('GEARWRENCH') or name_upper.startswith('GW_') or name_upper.startswith('GW-'):
            return 'GEARWRENCH'
        if name_upper.startswith('CRESCENT') or name_upper.startswith('CT_') or name_upper.startswith('CT-'):
            return 'Crescent'
        if name_upper.startswith('WELLER'):
            return 'Weller'
        if name_upper.startswith('CLECO'):
            return 'Cleco'
        if name_upper.startswith('SATA'):
            return 'SATA'
        
        return 'Other'
    
    def get_custom_status_name(self, status_id):
        """Get the human-readable name for a custom status ID"""
        try:
            response = requests.get(
                f"{self.base_url}/customstatuses/{status_id}",
                headers=self.headers
            )
            response.raise_for_status()
            status_data = response.json().get('data', [])
            if status_data:
                return status_data[0].get('name', status_id)
        except:
            pass
        return status_id
    
    def get_folders(self):
        """Get all folders/spaces from Wrike"""
        try:
            response = requests.get(
                f"{self.base_url}/folders",
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            return response.json().get('data', [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching folders: {e}")
            return []
    
    def get_projects_from_folder(self, folder_id, start_date, end_date):
        """Get projects from a specific folder within date range"""
        try:
            response = requests.get(
                f"{self.base_url}/folders/{folder_id}/folders",
                headers=self.headers,
                params={
                    'project': 'true',
                    'fields': '["customFields","metadata"]'
                },
                timeout=30
            )
            response.raise_for_status()
            projects = response.json().get('data', [])
            
            filtered_projects = []
            for project in projects:
                created_date_str = project.get('createdDate', '')
                if not created_date_str:
                    continue
                
                try:
                    if '.' in created_date_str:
                        created_date_str = created_date_str.split('.')[0]
                    created_date_str = created_date_str.replace('Z', '')
                    created_date = datetime.strptime(created_date_str, '%Y-%m-%dT%H:%M:%S')
                except ValueError:
                    try:
                        created_date = datetime.strptime(created_date_str, '%Y-%m-%d')
                    except ValueError:
                        continue
                
                if start_date <= created_date <= end_date:
                    filtered_projects.append(project)
            
            return filtered_projects
        except requests.exceptions.RequestException as e:
            print(f"Error fetching projects from folder {folder_id}: {e}")
            return []
    
    def get_archive_projects(self, folder_id, space_name, start_date, end_date):
        """Get projects from archive folders within a space"""
        try:
            current_year = datetime.now().year
            
            response = requests.get(
                f"{self.base_url}/folders/{folder_id}/folders",
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            subfolders = response.json().get('data', [])
            
            archive_folder_id = None
            
            if space_name == "Photography":
                for folder in subfolders:
                    if folder.get('title') == 'Completed Projects':
                        year_response = requests.get(
                            f"{self.base_url}/folders/{folder['id']}/folders",
                            headers=self.headers,
                            timeout=30
                        )
                        year_response.raise_for_status()
                        year_folders = year_response.json().get('data', [])
                        
                        for year_folder in year_folders:
                            if str(current_year) in year_folder.get('title', ''):
                                archive_folder_id = year_folder['id']
                                break
                        break
            else:
                for folder in subfolders:
                    if folder.get('title') == '00 - Archive':
                        year_response = requests.get(
                            f"{self.base_url}/folders/{folder['id']}/folders",
                            headers=self.headers,
                            timeout=30
                        )
                        year_response.raise_for_status()
                        year_folders = year_response.json().get('data', [])
                        
                        for year_folder in year_folders:
                            if f"{current_year} Archive" == year_folder.get('title'):
                                archive_folder_id = year_folder['id']
                                break
                        break
            
            if archive_folder_id:
                print(f"  Searching {current_year} archive for {space_name}")
                return self.get_projects_from_folder(archive_folder_id, start_date, end_date)
            else:
                print(f"  No {current_year} archive folder found for {space_name}")
            
            return []
            
        except requests.exceptions.Timeout:
            print(f"  Timeout while searching archive for {space_name} - skipping")
            return []
        except requests.exceptions.RequestException as e:
            print(f"  Error fetching archive projects from {space_name}: {e}")
            return []
    
    def collect_project_data(self):
        """Collect all project data from specified spaces"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        print(f"Collecting projects from {start_date.date()} to {end_date.date()}")
        
        all_folders = self.get_folders()
        
        target_folder_ids = []
        for folder in all_folders:
            if folder.get('title') in self.target_spaces:
                target_folder_ids.append({
                    'id': folder['id'],
                    'title': folder['title']
                })
                print(f"Found space: {folder['title']}")
        
        all_projects = []
        for folder_info in target_folder_ids:
            projects = self.get_projects_from_folder(
                folder_info['id'],
                start_date,
                end_date
            )
            for project in projects:
                project['space_name'] = folder_info['title']
                project['is_archived'] = False
            all_projects.extend(projects)
            print(f"Found {len(projects)} active projects in {folder_info['title']}")
            
            archive_projects = self.get_archive_projects(
                folder_info['id'],
                folder_info['title'],
                start_date,
                end_date
            )
            for project in archive_projects:
                project['space_name'] = folder_info['title']
                project['is_archived'] = True
            all_projects.extend(archive_projects)
            if archive_projects:
                print(f"Found {len(archive_projects)} archived projects in {folder_info['title']}")
        
        return all_projects, start_date, end_date
    
    def parse_project_data(self, project):
        """Extract relevant fields from a project"""
        created_date = project.get('createdDate', 'N/A')
        if created_date != 'N/A':
            try:
                if '.' in created_date:
                    created_date = created_date.split('.')[0]
                created_date = created_date.replace('Z', '')
                created_date = datetime.strptime(created_date, '%Y-%m-%dT%H:%M:%S').strftime('%m-%d-%Y')
            except:
                created_date = ''
        
        due_date = ''
        if 'project' in project and project['project'].get('endDate'):
            try:
                due_date = datetime.strptime(
                    project['project']['endDate'].split('T')[0],
                    '%Y-%m-%d'
                ).strftime('%m-%d-%Y')
            except:
                due_date = ''
        
        # Approved date - use updatedDate for archived projects
        approved_date = ''
        if project.get('is_archived', False):
            updated_date = project.get('updatedDate', '')
            if updated_date:
                try:
                    if '.' in updated_date:
                        updated_date = updated_date.split('.')[0]
                    updated_date = updated_date.replace('Z', '')
                    approved_date = datetime.strptime(updated_date, '%Y-%m-%dT%H:%M:%S').strftime('%m-%d-%Y')
                except:
                    approved_date = ''
        
        status = 'Active'
        if 'project' in project and 'customStatusId' in project['project']:
            status_id = project['project']['customStatusId']
            status = self.get_custom_status_name(status_id)
        elif 'project' in project and 'status' in project['project']:
            status = project['project']['status']
        elif project.get('scope'):
            status = project['scope']
        
        if project.get('is_archived', False):
            completed = 'Yes'
        else:
            completed = 'Yes' if status in ['Completed', 'Complete'] else 'No'

        # Extract Brand
        brand = self.extract_brand(project.get('title', ''))

        # Extract Custom Fields
        custom_brand = ''
        distributor = ''
        if 'customFields' in project:
            for cf in project['customFields']:
                field_def = self.custom_field_map.get(cf['id'])
                if field_def:
                    field_title = field_def['title']
                    val = cf.get('value', '')
                    
                    # Resolve Dropdown IDs to Names
                    if field_def['type'] == 'DropDown' and val in field_def['options']:
                        val = field_def['options'][val]
                        
                    if field_title == 'Brand':
                        custom_brand = val
                    elif field_title == 'Distributor':
                        distributor = val
        
        return {
            'name': project.get('title', 'Untitled'),
            'space': project.get('space_name', 'N/A'),
            'status': status,
            'created_date': created_date,
            'due_date': due_date,
            'approved_date': approved_date,
            'completed': completed,
            'brand': brand,
            'custom_brand': custom_brand,
            'distributor': distributor
        }
    
    def generate_pdf_report(self, projects, start_date, end_date, output_filename):
        """Generate PDF report matching exact layout"""
        print("Generating dashboard PDF...")
        
        # A4 Landscape: 841.89 x 595.27 points
        page_size = landscape(A4)
        PAGE_WIDTH = 841.89
        PAGE_HEIGHT = 595.27
        
        doc = SimpleDocTemplate(
            output_filename,
            pagesize=page_size,
            rightMargin=30,
            leftMargin=30,
            topMargin=25,
            bottomMargin=25
        )
        
        elements = []
        
        # Color definitions matching mockup
        metric_colors = [
            HexColor('#2196F3'),  # Blue
            HexColor('#9C27B0'),  # Purple
            HexColor('#4CAF50'),  # Green
            HexColor('#FF9800')   # Orange
        ]
        
        status_colors = {
            'New': HexColor('#FDCB6E'),
            'Production': HexColor('#0984E3'),
            'Completed': HexColor('#00B894'),
            'In Review': HexColor('#E74C3C'), # Red-ish
            'V1 - Revisions': HexColor('#A29BFE')
        }

        # Space Display Map
        space_map = {
            'DECOE Animation': '3D/Animation',
            'DECOE Digital Graphics': 'Digital Graphics',
            'DECOE Email Marketing': 'Email Marketing',
            'DECOE Uncategorized': 'Uncategorized',
            'Photography': 'Photography'
        }
        
        # Styles
        styles = getSampleStyleSheet()
        
        # === HEADER ===
        title_style = ParagraphStyle(
            'Title',
            fontName='Helvetica-Bold',
            fontSize=32,
            textColor=black,
            spaceAfter=3
        )
        
        subtitle_style = ParagraphStyle(
            'Subtitle',
            fontName='Helvetica',
            fontSize=10,
            textColor=HexColor('#808080'),
            spaceAfter=12
        )
        
        title = Paragraph("Project Dashboard", title_style)
        elements.append(title)
        
        total_projects = len(projects)
        subtitle_text = f"{start_date.strftime('%B %#d')} - {end_date.strftime('%B %#d, %Y')} • {total_projects} Total Projects"
        subtitle = Paragraph(subtitle_text, subtitle_style)
        elements.append(subtitle)
        
        # === METRIC CARDS ===
        completed_projects = sum(1 for p in projects if p['completed'] == 'Yes')
        active_projects = total_projects - completed_projects
        completion_rate = (completed_projects / total_projects * 100) if total_projects > 0 else 0
        
        card_label_style = ParagraphStyle('CardLabel', fontName='Helvetica-Bold', fontSize=9,
                                         textColor=white, alignment=TA_CENTER)
        card_value_style = ParagraphStyle('CardValue', fontName='Helvetica-Bold', fontSize=36,
                                         textColor=white, alignment=TA_CENTER)
        
        metrics_data = [
            [
                Paragraph("TOTAL PROJECTS", card_label_style),
                Paragraph("ACTIVE", card_label_style),
                Paragraph("COMPLETED", card_label_style),
                Paragraph("COMPLETION RATE", card_label_style)
            ],
            [
                Paragraph(str(total_projects), card_value_style),
                Paragraph(str(active_projects), card_value_style),
                Paragraph(str(completed_projects), card_value_style),
                Paragraph(f"{completion_rate:.0f}%", card_value_style)
            ]
        ]
        
        # Each card is 1/4 of usable width (minus margins and gaps)
        usable_width = PAGE_WIDTH - 60  # 30px margins on each side
        card_width = (usable_width - 12) / 4  # 4px gaps between cards
        
        metrics_table = Table(metrics_data, colWidths=[card_width] * 4, rowHeights=[22, 58])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), metric_colors[0]),
            ('BACKGROUND', (1, 0), (1, -1), metric_colors[1]),
            ('BACKGROUND', (2, 0), (2, -1), metric_colors[2]),
            ('BACKGROUND', (3, 0), (3, -1), metric_colors[3]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(metrics_table)
        elements.append(Spacer(1, 15))
        
        # === CALCULATE DATA FOR CHARTS ===
        # Projects by category (space) counts
        category_counts = {}
        for space in self.target_spaces:
            count = sum(1 for p in projects if p['space'] == space)
            category_counts[space] = count
        
        # Status distribution
        status_counts = {}
        for proj in projects:
            status = proj['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Projects by week
        week_counts = {}
        for proj in projects:
            created_str = proj['created_date']
            if created_str:
                try:
                    created = datetime.strptime(created_str, '%m-%d-%Y')
                    week_num = created.isocalendar()[1]
                    week_counts[week_num] = week_counts.get(week_num, 0) + 1
                except:
                    pass
        
        # Brand distribution
        brand_counts = {brand: 0 for brand in self.brands}
        brand_counts['Other'] = 0
        for proj in projects:
            brand = self.extract_brand(proj['name'])
            brand_counts[brand] = brand_counts.get(brand, 0) + 1
        
        # === CREATE CHARTS (High Resolution) ===
        
        # Chart 1: Projects by Category (Horizontal Bar)
        fig1, ax1 = plt.subplots(figsize=(4.2, 2.8))
        fig1.patch.set_facecolor('white')
        
        # Order: Photography (top) → Uncategorized → Email → Graphics → Animation (bottom)
        category_order = ['Photography', 'DECOE Uncategorized', 'DECOE Email Marketing', 
                         'DECOE Digital Graphics', 'DECOE Animation']
        display_names = ['Photography', 'Uncategorized', 'Email Marketing', 'Graphics', '3D/Animation']
        counts_ordered = [category_counts.get(cat, 0) for cat in category_order]
        colors_cat = ['#E17055', '#FDCB6E', '#00B894', '#0984E3', '#6C5CE7']
        
        y_pos = range(len(display_names))
        bars = ax1.barh(y_pos, counts_ordered, color=colors_cat, height=0.65, edgecolor='white', linewidth=2)
        ax1.set_yticks(y_pos)
        ax1.set_yticklabels(display_names, fontsize=9, fontweight='500', color='#333')
        ax1.set_xlabel('Projects', fontsize=9, color='#333', fontweight='600')
        ax1.set_title('Projects by Category', fontsize=12, fontweight='bold', color='#333', pad=10, loc='left')
        ax1.set_facecolor('#FAFAFA')
        ax1.grid(axis='x', alpha=0.2, linestyle='-', linewidth=0.5)
        ax1.spines['top'].set_visible(False)
        ax1.spines['right'].set_visible(False)
        ax1.spines['left'].set_color('#E0E0E0')
        ax1.spines['bottom'].set_color('#E0E0E0')
        
        for i, (bar, count) in enumerate(zip(bars, counts_ordered)):
            width = bar.get_width()
            ax1.text(width + 0.5, i, str(count), va='center', ha='left',
                    fontsize=10, fontweight='bold', color='#333')
        
        plt.tight_layout()
        img_buffer1 = BytesIO()
        plt.savefig(img_buffer1, format='png', dpi=200, bbox_inches='tight', facecolor='white')
        img_buffer1.seek(0)
        plt.close()
        
        # Chart 2: Status Distribution (Donut) - WIDER
        fig2, ax2 = plt.subplots(figsize=(4.2, 2.8))
        fig2.patch.set_facecolor('white')
        
        if status_counts:
            statuses = list(status_counts.keys())
            status_values = list(status_counts.values())
            # Updated colors here
            colors_status = ['#0984E3', '#FDCB6E', '#00B894', '#E74C3C', '#E17055'][:len(statuses)]
            
            wedges, texts = ax2.pie(status_values, labels=None, 
                                                colors=colors_status, startangle=90,
                                                textprops={'fontsize': 11, 'fontweight': 'bold', 'color': 'white'},
                                                wedgeprops={'width': 0.42, 'edgecolor': 'white', 'linewidth': 3})
            
            ax2.set_title('Status Distribution', fontsize=13, fontweight='bold', color='#333', pad=12)
            
            # Legend below
            legend_labels = [f'{s} ({v})' for s, v in zip(statuses, status_values)]
            ax2.legend(legend_labels, loc='upper center', bbox_to_anchor=(0.5, -0.05), 
                      ncol=3, fontsize=8, frameon=False, labelcolor='#333')
        
        plt.tight_layout()
        img_buffer2 = BytesIO()
        plt.savefig(img_buffer2, format='png', dpi=200, bbox_inches='tight', facecolor='white')
        img_buffer2.seek(0)
        plt.close()
        
        # Chart 3: Project Timeline (Line)
        fig3, ax3 = plt.subplots(figsize=(4.2, 2.8))
        fig3.patch.set_facecolor('white')
        
        if week_counts:
            weeks = sorted(week_counts.keys())
            counts_by_week = [week_counts[w] for w in weeks]
            
            ax3.plot(weeks, counts_by_week, marker='o', linewidth=3.5, markersize=11,
                    color='#0984E3', markerfacecolor='#64B5F6', markeredgewidth=3, markeredgecolor='#0984E3')
            ax3.fill_between(weeks, counts_by_week, alpha=0.2, color='#0984E3')
            ax3.set_xlabel('Week Number', fontsize=10, color='#333', fontweight='600')
            ax3.set_ylabel('Projects Created', fontsize=10, color='#333', fontweight='600')
            ax3.set_title('Project Timeline', fontsize=13, fontweight='bold', color='#333', pad=12, loc='left')
            ax3.set_facecolor('#FAFAFA')
            ax3.grid(True, alpha=0.2, linestyle='-', linewidth=0.5)
            ax3.tick_params(labelsize=10, colors='#333')
            ax3.spines['top'].set_visible(False)
            ax3.spines['right'].set_visible(False)
            ax3.spines['left'].set_color('#E0E0E0')
            ax3.spines['bottom'].set_color('#E0E0E0')
        
        plt.tight_layout()
        img_buffer3 = BytesIO()
        plt.savefig(img_buffer3, format='png', dpi=200, bbox_inches='tight', facecolor='white')
        img_buffer3.seek(0)
        plt.close()
        
        # Chart 4: Request by Brand (Donut) - UPDATED FOR EXACT MATCH
        fig4, ax4 = plt.subplots(figsize=(4.2, 2.8))
        fig4.patch.set_facecolor('white')
        
        # Brand colors matching actual brands
        brand_color_map = {
            'GEARWRENCH': '#ed8b00',  # Updated Orange
            'Crescent': '#da4d1f',     # Updated Rust/Red-Orange
            'Weller': '#64B5F6',       # Light Blue
            'Cleco': '#FF9800',        # Orange
            'SATA': '#9B59B6',         # Purple
            'Other': '#95A5A6'         # Gray
        }
        
        # Order for donut: Crescent, GEARWRENCH, Other (clockwise from top)
        brand_order = ['Crescent', 'GEARWRENCH', 'Other', 'Weller', 'Cleco', 'SATA']
        brand_values = [brand_counts.get(b, 0) for b in brand_order]
        colors_brand = [brand_color_map[b] for b in brand_order]
        
        # Filter out zeros
        filtered_brands = []
        filtered_values = []
        filtered_colors = []
        for brand, val, col in zip(brand_order, brand_values, colors_brand):
            if val > 0:
                filtered_brands.append(brand)
                filtered_values.append(val)
                filtered_colors.append(col)
        
        if filtered_values:
            total_brand = sum(filtered_values)
            percentages = [(v/total_brand*100) for v in filtered_values]
            
            # Donut chart
            wedges, texts = ax4.pie(filtered_values, labels=None,
                                                colors=filtered_colors, startangle=90,
                                                wedgeprops={'width': 0.42, 'edgecolor': 'white', 'linewidth': 3})
            
            ax4.set_title('Request by Brand', fontsize=13, fontweight='bold', color='#333', pad=12)
            
            # Legend on right with percentages (UPDATED)
            legend_labels = [f'{b} - {p:.0f}%' for b, p in zip(filtered_brands, percentages)]
            ax4.legend(legend_labels, loc='center left', bbox_to_anchor=(1, 0.5),
                      fontsize=9, frameon=False, labelcolor='#333')
        
        plt.tight_layout()
        img_buffer4 = BytesIO()
        plt.savefig(img_buffer4, format='png', dpi=200, bbox_inches='tight', facecolor='white')
        img_buffer4.seek(0)
        plt.close()
        
        # === ARRANGE CHARTS IN ROW ===
        chart_row = [
            Image(img_buffer1, width=210, height=140),
            Spacer(8, 8),
            Image(img_buffer2, width=210, height=140),
            Spacer(8, 8),
            Image(img_buffer3, width=210, height=140),
            Spacer(8, 8),
            Image(img_buffer4, width=210, height=140)
        ]
        
        chart_table = Table([chart_row])
        elements.append(chart_table)
        elements.append(Spacer(1, 20))
        
        # === PROJECT TABLES BY BRAND ===
        section_title_style = ParagraphStyle(
            'SectionTitle',
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=black,
            spaceAfter=10
        )
        
        elements.append(Paragraph("Projects by Brand", section_title_style))
        elements.append(Spacer(1, 5))
        
        # Table header style
        table_header_style = ParagraphStyle('TableHeader', fontName='Helvetica-Bold', fontSize=9,
                                           textColor=white, alignment=TA_LEFT)
        table_cell_style = ParagraphStyle('TableCell', fontName='Helvetica', fontSize=8,
                                         textColor=black)
        
        # Sort brands alphabetically
        unique_brands = sorted(list(set(p['brand'] for p in projects)))
        
        for brand in unique_brands:
            brand_projects = [p for p in projects if p['brand'] == brand]
            
            if not brand_projects:
                continue
            
            is_other = (brand == 'Other')

            # Use consistent blue for all table headers (UPDATED)
            table_header_color = HexColor('#1976D2')
            
            # Section header
            count_text = f"{brand} ({len(brand_projects)} projects)"
            space_header_style = ParagraphStyle('SpaceHeader', fontName='Helvetica-Bold', fontSize=11,
                                               textColor=black, spaceAfter=5)
            elements.append(Paragraph(count_text, space_header_style))
            
            # Create table - show ALL projects (NO LIMIT)
            header_row = [
                Paragraph("Project", table_header_style),
                Paragraph("Category", table_header_style), 
            ]
            
            # ADD COLUMNS FOR OTHER
            if is_other:
                header_row.append(Paragraph("Brand", table_header_style))
                header_row.append(Paragraph("Distributor", table_header_style))

            header_row.extend([
                Paragraph("Status", table_header_style),
                Paragraph("Created", table_header_style),
                Paragraph("Due Date", table_header_style),
                Paragraph("Approved Date", table_header_style),
                Paragraph("Done", table_header_style)
            ])

            table_data = [header_row]
            
            for proj in brand_projects:
                status_color = status_colors.get(proj['status'], HexColor('#808080'))
                status_text = f"<font color='white'><b>{proj['status'][:15]}</b></font>"
                
                proj_name = proj['name'][:60] + '...' if len(proj['name']) > 60 else proj['name']
                
                # Only show green checkmark for completed, nothing for incomplete
                done_symbol = '✓' if proj['completed'] == 'Yes' else ''
                
                # Show approved date if it exists
                approved_display = proj['approved_date'] if proj['approved_date'] else ''
                
                # Map space to friendly name
                space_display = space_map.get(proj['space'], proj['space'])
                
                row_data = [
                    proj_name,
                    space_display, # Show Category
                ]
                
                if is_other:
                    row_data.append(proj.get('custom_brand', '-'))
                    row_data.append(proj.get('distributor', '-'))

                row_data.extend([
                    Paragraph(status_text, table_cell_style),
                    proj['created_date'],
                    proj['due_date'],
                    approved_display,
                    done_symbol
                ])

                table_data.append(row_data)
            
            # Column widths
            # Default
            col_widths = [180, 80, 75, 75, 80, 70, 40]
            
            if is_other:
                # Project, Cat, Brand, Dist, Status, Created, Due, Approved, Done
                col_widths = [140, 60, 50, 50, 70, 70, 70, 70, 30]

            space_table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Indices shift if other
            done_idx = 8 if is_other else 6
            status_idx = 4 if is_other else 2

            style_commands = [
                ('BACKGROUND', (0, 0), (-1, 0), table_header_color),  # ALL TABLES BLUE
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'CENTER'), # Center Category Column (Index 1)
                ('ALIGN', (done_idx, 0), (done_idx, -1), 'CENTER'), # Done column index
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                
                ('BACKGROUND', (0, 1), (-1, -1), white),
                ('TEXTCOLOR', (0, 1), (-1, -1), black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('FONTSIZE', (done_idx, 1), (done_idx, -1), 12),
                ('TEXTCOLOR', (done_idx, 1), (done_idx, -1), HexColor('#4CAF50')),  # Green checkmarks
                
                ('LINEBELOW', (0, 0), (-1, 0), 2, table_header_color),
                ('GRID', (0, 1), (-1, -1), 0.5, HexColor('#E0E0E0')),
            ]
            
            # Add status cell colors
            for i, proj in enumerate(brand_projects, start=1):
                status_color = status_colors.get(proj['status'], HexColor('#808080'))
                style_commands.append(('BACKGROUND', (status_idx, i), (status_idx, i), status_color))
            
            space_table.setStyle(TableStyle(style_commands))
            elements.append(space_table)
            elements.append(Spacer(1, 12))
        
        doc.build(elements)
        print(f"Dashboard PDF complete: {output_filename}")
    
    def generate_report(self, output_filename="wrike_dashboard.pdf"):
        """Main method to generate the complete report"""
        print("Starting Wrike report generation...")
        
        projects, start_date, end_date = self.collect_project_data()
        
        if not projects:
            print("No projects found in the specified date range and spaces.")
            return
        
        parsed_projects = [self.parse_project_data(proj) for proj in projects]
        
        self.generate_pdf_report(parsed_projects, start_date, end_date, output_filename)
        
        return output_filename


if __name__ == "__main__":
    try:
        from config import WRIKE_API_TOKEN, OUTPUT_FILENAME
        API_TOKEN = WRIKE_API_TOKEN
        output_filename = OUTPUT_FILENAME
    except ImportError:
        print("Config file not found. Using default values.")
        API_TOKEN = "YOUR_WRIKE_API_TOKEN_HERE"
        output_filename = "wrike_dashboard.pdf"
    
    if API_TOKEN == "YOUR_WRIKE_API_TOKEN_HERE":
        print("ERROR: Please update config.py with your Wrike API token!")
        exit(1)
    
    generator = WrikeReportGenerator(API_TOKEN)
    output_file = generator.generate_report(output_filename)
    print(f"\\nReport complete! File saved as: {output_file}")
    
    input("\\nPress Enter to close...")
`
