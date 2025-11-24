// ============================================
// COMPONENTE DE TABLA DINÁMICA
// ============================================

export class DataTable {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        this.options = {
            columns: options.columns || [],
            data: options.data || [],
            pagination: options.pagination !== false,
            pageSize: options.pageSize || 10,
            searchable: options.searchable !== false,
            sortable: options.sortable !== false,
            ...options
        };
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.filteredData = [...this.options.data];
    }

    render() {
        if (!this.container) return;

        let html = '';

        // Barra de búsqueda
        if (this.options.searchable) {
            html += `
                <div class="table-search">
                    <input type="text" class="table-search-input" placeholder="Buscar...">
                </div>
            `;
        }

        // Tabla
        html += `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${this.options.columns.map(col => `
                                <th ${this.options.sortable ? `class="sortable" data-column="${col.key}"` : ''}>
                                    ${col.label}
                                    ${this.options.sortable ? '<span class="sort-icon"></span>' : ''}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderRows()}
                    </tbody>
                </table>
            </div>
        `;

        // Paginación
        if (this.options.pagination) {
            html += this.renderPagination();
        }

        this.container.innerHTML = html;

        // Event listeners
        this.attachEvents();
    }

    renderRows() {
        const start = (this.currentPage - 1) * this.options.pageSize;
        const end = start + this.options.pageSize;
        const pageData = this.filteredData.slice(start, end);

        if (pageData.length === 0) {
            return `
                <tr>
                    <td colspan="${this.options.columns.length}" class="table-empty">
                        No hay datos para mostrar
                    </td>
                </tr>
            `;
        }

        return pageData.map((row, index) => `
            <tr data-index="${start + index}">
                ${this.options.columns.map(col => {
                    let value = row[col.key];
                    
                    if (col.render) {
                        value = col.render(value, row, start + index);
                    } else if (col.format) {
                        value = this.formatValue(value, col.format);
                    }

                    return `<td>${value || ''}</td>`;
                }).join('')}
            </tr>
        `).join('');
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        
        if (totalPages <= 1) return '';

        let html = '<div class="table-pagination">';
        
        // Botón anterior
        html += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Botón siguiente
        html += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        html += '</div>';

        return html;
    }

    attachEvents() {
        // Búsqueda
        const searchInput = this.container.querySelector('.table-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filter(e.target.value);
            });
        }

        // Ordenamiento
        if (this.options.sortable) {
            this.container.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.getAttribute('data-column');
                    this.sort(column);
                });
            });
        }

        // Paginación
        this.container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                if (page && !btn.disabled) {
                    this.goToPage(page);
                }
            });
        });
    }

    filter(searchTerm) {
        if (!searchTerm) {
            this.filteredData = [...this.options.data];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredData = this.options.data.filter(row => {
                return this.options.columns.some(col => {
                    const value = String(row[col.key] || '').toLowerCase();
                    return value.includes(term);
                });
            });
        }
        this.currentPage = 1;
        this.render();
    }

    sort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredData.sort((a, b) => {
            const aVal = a[column] || '';
            const bVal = b[column] || '';
            
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        this.render();
    }

    goToPage(page) {
        this.currentPage = page;
        this.render();
    }

    updateData(data) {
        this.options.data = data;
        this.filteredData = [...data];
        this.currentPage = 1;
        this.render();
    }

    formatValue(value, format) {
        switch (format) {
            case 'date':
                return new Date(value).toLocaleDateString('es-AR');
            case 'datetime':
                return new Date(value).toLocaleString('es-AR');
            case 'currency':
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
            default:
                return value;
        }
    }
}

