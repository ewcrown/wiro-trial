if (!customElements.get('gift-wrap-form')) {
  customElements.define(
    'gift-wrap-form',
    class GiftWrapForm extends HTMLElement {
      constructor() {
        super();

        this.toggleEl = this.querySelector('[data-gift-wrap-toggle]');
        this.fieldsEl = this.querySelector('[data-gift-wrap-fields]');
        this.checkboxVisualEl = this.querySelector('[data-checkbox-visual]');
        this.checkIconEl = this.querySelector('[data-check-icon]');
        this.toInputEl = this.querySelector('[data-gift-wrap-to]');
        this.fromInputEl = this.querySelector('[data-gift-wrap-from]');
        this.messageInputEl = this.querySelector('[data-gift-wrap-message]');

        this.toMax = parseInt(this.dataset.toMax, 10) || 50;
        this.fromMax = parseInt(this.dataset.fromMax, 10) || 50;
        this.messageMax = parseInt(this.dataset.messageMax, 10) || 200;

        this.handleToggle = this.handleToggle.bind(this);
        this.handleToInput = this.handleToInput.bind(this);
        this.handleFromInput = this.handleFromInput.bind(this);
        this.handleMessageInput = this.handleMessageInput.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
      }

      connectedCallback() {
        this.toggleEl.addEventListener('change', this.handleToggle);
        this.toInputEl.addEventListener('input', this.handleToInput);
        this.fromInputEl.addEventListener('input', this.handleFromInput);
        this.messageInputEl.addEventListener('input', this.handleMessageInput);

        this.productFormEl = this.findProductForm();
        if (this.productFormEl) {
          this.productFormEl.addEventListener('submit', this.handleFormSubmit, true);
        }
      }

      disconnectedCallback() {
        this.toggleEl.removeEventListener('change', this.handleToggle);
        this.toInputEl.removeEventListener('input', this.handleToInput);
        this.fromInputEl.removeEventListener('input', this.handleFromInput);
        this.messageInputEl.removeEventListener('input', this.handleMessageInput);

        if (this.productFormEl) {
          this.productFormEl.removeEventListener('submit', this.handleFormSubmit, true);
        }
        this.removeExistingGiftWrapInputs();
      }

      findProductForm() {
        const formId = this.dataset.productFormId;
        if (formId) {
          const directForm = document.getElementById(formId);
          if (directForm) return directForm;
        }

        const productInfoEl = this.closest('product-info') || document.querySelector('product-info');
        if (!productInfoEl) return document.querySelector('form[action*="/cart/add"]');

        return productInfoEl.querySelector('form[data-type="add-to-cart-form"]') || productInfoEl.querySelector('form[action*="/cart/add"]');
      }

      handleToggle() {
        const isChecked = this.toggleEl.checked;

        this.toggleEl.setAttribute('aria-expanded', String(isChecked));
        this.fieldsEl.setAttribute('aria-hidden', String(!isChecked));

        if (isChecked) {
          this.fieldsEl.style.gridTemplateRows = '1fr';
          this.checkboxVisualEl.classList.add('tw-bg-gray-900', 'tw-border-gray-900');
          this.checkIconEl.classList.remove('tw-opacity-0');
          this.checkIconEl.classList.add('tw-opacity-100');
          this.syncPropertiesToForm();
        } else {
          this.fieldsEl.style.gridTemplateRows = '0fr';
          this.checkboxVisualEl.classList.remove('tw-bg-gray-900', 'tw-border-gray-900');
          this.checkIconEl.classList.add('tw-opacity-0');
          this.checkIconEl.classList.remove('tw-opacity-100');
          this.clearFields();
          this.removeExistingGiftWrapInputs();
        }
      }

      handleToInput() {
        this.updateCharCount('to', this.toInputEl.value.length, this.toMax);
        if (this.toggleEl.checked) this.syncPropertiesToForm();
      }

      handleFromInput() {
        this.updateCharCount('from', this.fromInputEl.value.length, this.fromMax);
        if (this.toggleEl.checked) this.syncPropertiesToForm();
      }

      handleMessageInput() {
        this.updateCharCount('message', this.messageInputEl.value.length, this.messageMax);
        if (this.toggleEl.checked) this.syncPropertiesToForm();
      }

      updateCharCount(field, current, max) {
        const counterEl = this.querySelector(`[data-char-count="${field}"]`);
        if (!counterEl) return;

        counterEl.textContent = `${current} / ${max}`;

        if (current >= max) {
          counterEl.classList.add('tw-text-red-500');
          counterEl.classList.remove('tw-text-gray-400');
        } else {
          counterEl.classList.remove('tw-text-red-500');
          counterEl.classList.add('tw-text-gray-400');
        }
      }

      clearFields() {
        this.toInputEl.value = '';
        this.fromInputEl.value = '';
        this.messageInputEl.value = '';
        this.updateCharCount('to', 0, this.toMax);
        this.updateCharCount('from', 0, this.fromMax);
        this.updateCharCount('message', 0, this.messageMax);
      }

      syncPropertiesToForm() {
        if (!this.productFormEl) this.productFormEl = this.findProductForm();
        if (!this.productFormEl) return;

        this.removeExistingGiftWrapInputs();

        if (!this.toggleEl.checked) {
          this.giftWrapId = null;
          return;
        }

        if (!this.giftWrapId) {
          this.giftWrapId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        }

        this.appendHiddenInput(this.productFormEl, 'properties[Gift Wrap]', 'Yes');
        this.appendHiddenInput(this.productFormEl, 'properties[_gift_wrap_id]', this.giftWrapId);

        const priceVal = this.dataset.price;
        if (priceVal && priceVal !== '0') this.appendHiddenInput(this.productFormEl, 'properties[_Gift Wrap Price]', priceVal);

        const toVal = this.toInputEl.value.trim();
        if (toVal) this.appendHiddenInput(this.productFormEl, 'properties[To]', toVal);

        const fromVal = this.fromInputEl.value.trim();
        if (fromVal) this.appendHiddenInput(this.productFormEl, 'properties[From]', fromVal);

        const messageVal = this.messageInputEl.value.trim();
        if (messageVal) this.appendHiddenInput(this.productFormEl, 'properties[Gift Message]', messageVal);
      }

      async handleFormSubmit(evt) {
        this.syncPropertiesToForm();

        const giftWrapVariantId = this.dataset.giftWrapVariantId;
        if (!this.toggleEl.checked || !giftWrapVariantId) {
          if (this.toggleEl.checked) {
            setTimeout(() => {
              this.giftWrapId = null;
            }, 500);
          }
          return;
        }

        evt.preventDefault();
        evt.stopImmediatePropagation();

        const formEl = this.productFormEl;
        const submitBtn = formEl.querySelector('[type="submit"]');
        const spinner = formEl.querySelector('.loading__spinner');
        const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

        if (submitBtn) {
          submitBtn.setAttribute('aria-disabled', 'true');
          submitBtn.classList.add('loading');
        }
        if (spinner) spinner.classList.remove('hidden');

        const formData = new FormData(formEl);
        const mainVariantId = formData.get('id');
        const mainQty = parseInt(formData.get('quantity'), 10) || 1;
        const toVal = this.toInputEl.value.trim();
        const fromVal = this.fromInputEl.value.trim();
        const messageVal = this.messageInputEl.value.trim();
        const priceVal = this.dataset.price || '';

        const items = [
          {
            id: mainVariantId,
            quantity: mainQty,
            properties: {
              'Gift Wrap': 'Yes',
              'To': toVal,
              'From': fromVal,
              'Gift Message': messageVal,
              '_gift_wrap_id': this.giftWrapId,
              '_Gift Wrap Price': priceVal
            }
          },
          {
            id: giftWrapVariantId,
            quantity: 1,
            properties: {
              '_is_gift_wrap': 'true',
              '_gift_wrap_parent': this.giftWrapId
            }
          }
        ];

        const sections = cart ? cart.getSectionsToRender().map((s) => s.id) : [];
        const body = JSON.stringify({
          items,
          sections,
          sections_url: window.location.pathname
        });

        const addUrl = window.routes?.cart_add_url || '/cart/add.js';

        try {
          const res = await fetch(addUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body
          });
          const response = await res.json();

          if (response.status) {
            alert(response.description || response.message);
            return;
          }
          if (cart) {
            cart.renderContents(response);
          }
          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, { source: 'product-form', productVariantId: mainVariantId, cartData: response });
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.removeAttribute('aria-disabled');
          }
          if (spinner) spinner.classList.add('hidden');
          if (cart && cart.classList.contains('is-empty')) cart.classList.remove('is-empty');
          this.giftWrapId = null;
        }
      }

      removeExistingGiftWrapInputs() {
        if (!this.productFormEl) this.productFormEl = this.findProductForm();
        if (!this.productFormEl) return;

        const existingInputEls = [
          ...this.productFormEl.querySelectorAll('[data-gift-wrap-property]'),
        ];
        for (const inputEl of existingInputEls) inputEl.remove();
      }

      appendHiddenInput(formEl, name, value) {
        const inputEl = document.createElement('input');
        inputEl.type = 'hidden';
        inputEl.name = name;
        inputEl.value = value;
        inputEl.setAttribute('data-gift-wrap-property', '');
        formEl.appendChild(inputEl);
      }
    }
  );
}
