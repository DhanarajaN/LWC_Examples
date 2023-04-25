import { LightningElement, api, wire } from 'lwc';
import {
	publish,
	subscribe,
	unsubscribe,
	MessageContext
} from 'lightning/messageService';
import SINGLE_SELECT_LMS from '@salesforce/messageChannel/Single_Select__c';
import HIDE_SHOW_LMS from '@salesforce/messageChannel/Hide_Show__c';

import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class LightningCard extends LightningElement {
	//global varibles
	@api cardValue;
	@api useSingleSelect = false;
	@api subscribeToHideShow = false;
	@api triggerHideShow = false;
	@api hideShowLMSValue = 'Hide_Show_Logic';
	@api selectedValue = '';

	@api customValueToUpdate = '';
	handleChange(event) {
		this.customValueToUpdate = event.target.value;
		this.dispatchEvent(new FlowAttributeChangeEvent('customValueToUpdate', this.customValueToUpdate));
	}

	//to support custom sizing
	@api isInCustomFlexContainer = false;

	_singleSelectSubscription;
	_hideShowSubscription;
	_hideCard = true;
	_isSelected = false;

	get _selectedClass() {
		let className = 'cardContainer';
		className += (this._isSelected ? ' selected' : '');
		className += (this.isInCustomFlexContainer ? ' Custom_Card_Flex_Container' : '');
		return className;
	}

	@wire(MessageContext)
	messageContext;

	connectedCallback() {
		this.subscribeToMessageChannel();
		if (!this.subscribeToHideShow) {
			this._hideCard = false;
		}
	}

	disconnectedCallback() {
		unsubscribe(this._singleSelectSubscription);
		this._singleSelectSubscription = null;
		unsubscribe(this._hideShowSubscription);
		this._hideShowSubscription = null;
	}

	subscribeToMessageChannel() {
		if (this.useSingleSelect) {
			this._singleSelectSubscription = subscribe(
				this.messageContext,
				SINGLE_SELECT_LMS,
				(message) => this.handleSiblingSelection(message)
			);
		}
		if (this.subscribeToHideShow) {
			this._hideShowSubscription = subscribe(
				this.messageContext,
				HIDE_SHOW_LMS,
				(message) => this.handleShowHide(message)
			);
		}
	}

	handleSiblingSelection(message) {
		if (this.cardValue != message.Selected_Value && this._isSelected) {
			this._isSelected = false;
		}
		this.selectedValue = this._isSelected ? this.cardValue : '';
	}

	//event handler
	handleShowHide(message) {
		this._hideCard = true;
		if (this.hideShowLMSValue == message.Selected_Value) {
			this._hideCard = false;
		}
	}

	//event fire
	handleClick() {
		this._isSelected = !this._isSelected;
		this.selectedValue = this._isSelected ? this.cardValue : '';
		const messagePayload = { Selected_Value: this.selectedValue };
		if (this.useSingleSelect) {
			publish(this.messageContext, SINGLE_SELECT_LMS, messagePayload);
		}
		if (this.triggerHideShow) {
			publish(this.messageContext, HIDE_SHOW_LMS, messagePayload);
		}
	}
}
