// ============================================
// COMPONENTE MODAL REUTILIZABLE
// ============================================

export class Modal {
    constructor(id, options = {}) {
        this.id = id;
        this.options = {
            closable: options.closable !== false,
            backdrop: options.backdrop !== false,
            size: options.size || 'medium', // small, medium, large, xlarge
            ...options
        };
        this.element = null;
        this.isOpen = false;
    }

    create(content) {
        const modal = document.createElement('div');
        modal.id = this.id;
        modal.className = 'modal';
        
        const sizeClass = `modal-${this.options.size}`;
        
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content ${sizeClass}">
                ${this.options.title ? `
                    <div class="modal-header">
                        <h3 class="modal-title">${this.options.title}</h3>
                        ${this.options.closable ? '<button class="modal-close">&times;</button>' : ''}
                    </div>
                ` : ''}
                <div class="modal-body">
                    ${content}
                </div>
                ${this.options.footer ? `
                    <div class="modal-footer">
                        ${this.options.footer}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);
        this.element = modal;

        // Event listeners
        if (this.options.closable) {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }
        }

        if (this.options.backdrop) {
            const backdrop = modal.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', () => {
                    if (this.options.closable) this.close();
                });
            }
        }

        // Cerrar con ESC
        document.addEventListener('keydown', this.handleEscape = (e) => {
            if (e.key === 'Escape' && this.isOpen && this.options.closable) {
                this.close();
            }
        });

        return modal;
    }

    open() {
        if (!this.element) return;
        
        this.element.classList.add('active');
        document.body.classList.add('modal-open');
        this.isOpen = true;

        // Trigger event
        this.element.dispatchEvent(new CustomEvent('modal:open', { detail: this }));
    }

    close() {
        if (!this.element) return;
        
        this.element.classList.remove('active');
        document.body.classList.remove('modal-open');
        this.isOpen = false;

        // Trigger event
        this.element.dispatchEvent(new CustomEvent('modal:close', { detail: this }));
    }

    destroy() {
        if (this.handleEscape) {
            document.removeEventListener('keydown', this.handleEscape);
        }
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    setContent(content) {
        if (this.element) {
            const body = this.element.querySelector('.modal-body');
            if (body) body.innerHTML = content;
        }
    }

    setTitle(title) {
        if (this.element) {
            const titleEl = this.element.querySelector('.modal-title');
            if (titleEl) titleEl.textContent = title;
        }
    }
}

