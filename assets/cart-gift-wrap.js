if (!customElements.get('cart-gift-wrap')) {
  class CartGiftWrap extends HTMLElement {
    constructor() {
      super();

      this.viewModeEl = this.querySelector('[data-view-mode]');
      this.editModeEl = this.querySelector('[data-edit-mode]');
      this.editBtnEl = this.querySelector('[data-edit-button]');
      this.cancelBtnEl = this.querySelector('[data-cancel-button]');
      this.updateBtnEl = this.querySelector('[data-update-button]');
      this.buttonTextEl = this.querySelector('[data-button-text]');
      this.spinnerEl = this.querySelector('[data-loading-spinner]');
      this.toggleEl = this.querySelector('[data-cart-gift-wrap-toggle]');
      this.checkboxBoxEl = this.querySelector('[data-checkbox-box]');
      this.checkIconEl = this.querySelector('[data-check-icon]');
      this.formFieldsEl = this.querySelector('[data-form-fields]');

      this.toInputEl = this.querySelector('[data-input-to]');
      this.fromInputEl = this.querySelector('[data-input-from]');
      this.messageInputEl = this.querySelector('[data-input-message]');

      this.lineKey = this.dataset.lineKey;
      this.quantity = parseInt(this.dataset.quantity, 10) || 1;
      this.price = this.dataset.price || '';
      this.hasGiftWrap = this.dataset.hasGiftWrap === 'true';

      this.initialTo = this.toInputEl?.value || '';
      this.initialFrom = this.fromInputEl?.value || '';
      this.initialMessage = this.messageInputEl?.value || '';

      this.handleEdit = this.handleEdit.bind(this);
      this.handleCancel = this.handleCancel.bind(this);
      this.handleToggle = this.handleToggle.bind(this);
      this.handleUpdate = this.handleUpdate.bind(this);
    }

    connectedCallback() {
      this.editBtnEl?.addEventListener('click', this.handleEdit);
      this.cancelBtnEl?.addEventListener('click', this.handleCancel);
      this.toggleEl?.addEventListener('change', this.handleToggle);
      this.updateBtnEl?.addEventListener('click', this.handleUpdate);
    }

    disconnectedCallback() {
      this.editBtnEl?.removeEventListener('click', this.handleEdit);
      this.cancelBtnEl?.removeEventListener('click', this.handleCancel);
      this.toggleEl?.removeEventListener('change', this.handleToggle);
      this.updateBtnEl?.removeEventListener('click', this.handleUpdate);
    }

    handleEdit() {
      this.viewModeEl?.classList.add('tw-hidden');
      this.editModeEl?.classList.remove('tw-hidden');
    }

    handleCancel() {
      if (this.hasGiftWrap) {
        if (this.toInputEl) this.toInputEl.value = this.initialTo;
        if (this.fromInputEl) this.fromInputEl.value = this.initialFrom;
        if (this.messageInputEl) this.messageInputEl.value = this.initialMessage;
        if (this.toggleEl) {
          this.toggleEl.checked = true;
          this.updateCheckboxUI(true);
        }
        this.editModeEl?.classList.add('tw-hidden');
        this.viewModeEl?.classList.remove('tw-hidden');
      } else {
        if (this.toggleEl) {
          this.toggleEl.checked = false;
          this.updateCheckboxUI(false);
        }
      }
    }

    handleToggle() {
      const isChecked = this.toggleEl?.checked ?? false;
      this.updateCheckboxUI(isChecked);
      if (isChecked) {
        this.formFieldsEl?.classList.remove('tw-hidden');
      } else if (!this.hasGiftWrap) {
        this.formFieldsEl?.classList.add('tw-hidden');
      }
    }

    updateCheckboxUI(isChecked) {
      if (!this.checkboxBoxEl || !this.checkIconEl) return;
      if (isChecked) {
        this.checkboxBoxEl.classList.add('tw-bg-[#1E1E1E]', 'tw-border-[#1E1E1E]');
        this.checkboxBoxEl.classList.remove('tw-border-gray-400', 'tw-bg-white');
        this.checkIconEl.classList.remove('tw-opacity-0');
      } else {
        this.checkboxBoxEl.classList.remove('tw-bg-[#1E1E1E]', 'tw-border-[#1E1E1E]');
        this.checkboxBoxEl.classList.add('tw-border-gray-400', 'tw-bg-white');
        this.checkIconEl.classList.add('tw-opacity-0');
      }
    }

    async handleUpdate() {
      this.setLoading(true);

      const isChecked = this.toggleEl?.checked ?? false;
      const toVal = this.toInputEl?.value.trim() || '';
      const fromVal = this.fromInputEl?.value.trim() || '';
      const messageVal = this.messageInputEl?.value.trim() || '';
      const connectedKey = this.dataset.connectedKey;
      let giftWrapId = this.dataset.giftWrapId;

      if (!isChecked) {
        giftWrapId = '';
      } else if (!giftWrapId) {
        giftWrapId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }

      const properties = {
        'Gift Wrap': isChecked ? 'Yes' : '',
        'To': isChecked ? toVal : '',
        'From': isChecked ? fromVal : '',
        'Gift Message': isChecked ? messageVal : '',
        '_gift_wrap_id': giftWrapId,
        '_Gift Wrap Price': isChecked ? this.price : ''
      };

      try {
        if (!isChecked && connectedKey) {
          await fetch(window.routes?.cart_update_url || '/cart/update.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ updates: { [connectedKey]: 0 } })
          });
        }

        const cartDrawerItems = document.querySelector('cart-drawer-items') || document.querySelector('cart-items');
        const sectionsToRender = cartDrawerItems
          ? cartDrawerItems.getSectionsToRender()
          : [
            { id: 'CartDrawer', section: 'cart-drawer', selector: '.drawer__inner' },
            { id: 'cart-icon-bubble', section: 'cart-icon-bubble', selector: '.shopify-section' }
          ];

        const changeUrl = window.routes?.cart_change_url || '/cart/change.js';

        const body = JSON.stringify({
          id: this.lineKey,
          quantity: this.quantity,
          properties,
          sections: sectionsToRender.map((s) => s.section || s.id),
          sections_url: window.location.pathname
        });

        const response = await fetch(changeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body
        });

        const parsedState = await response.json();

        if (parsedState.errors) {
          alert(parsedState.errors);
          this.setLoading(false);
          return;
        }

        sectionsToRender.forEach((section) => {
          const targetContainer = document.getElementById(section.id);
          if (!targetContainer) return;
          const elementToReplace = targetContainer.querySelector(section.selector) || targetContainer;
          const sectionHtml = parsedState.sections?.[section.section || section.id];
          if (elementToReplace && sectionHtml) {
            const parsedDOM = new DOMParser().parseFromString(sectionHtml, 'text/html');
            const newContent = section.selector ? parsedDOM.querySelector(section.selector)?.innerHTML : parsedDOM.body.innerHTML;
            if (newContent) elementToReplace.innerHTML = newContent;
          }
        });

        if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-gift-wrap', cartData: parsedState });
      } catch (err) {
        console.error('Error updating gift wrap in cart:', err);
        this.setLoading(false);
      }
    }

    setLoading(isLoading) {
      if (!this.updateBtnEl) return;
      this.updateBtnEl.disabled = isLoading;
      if (isLoading) {
        this.buttonTextEl?.classList.add('tw-opacity-0');
        this.spinnerEl?.classList.remove('tw-hidden');
      } else {
        this.buttonTextEl?.classList.remove('tw-opacity-0');
        this.spinnerEl?.classList.add('tw-hidden');
      }
    }
  }

  customElements.define('cart-gift-wrap', CartGiftWrap);
}