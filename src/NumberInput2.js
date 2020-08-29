import './numberCurrency/object-assign-polyfill';

import PropTypes from 'prop-types';
import React, { Component }  from 'react'
import ReactDOM from 'react-dom'
import mask from './numberCurrency/mask'

// IE* parseFloat polyfill
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseFloat#Polyfill
Number.parseFloat = parseFloat;

class NumberInput2 extends Component {
    constructor(props) {
        super(props);
        this.prepareProps = this.prepareProps.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.setSelectionRange = this.setSelectionRange.bind(this);
        this.state = this.prepareProps(this.props);

        this.inputSelectionStart = 1;
        this.inputSelectionEnd = 1;
    }


    /**
     * Exposes the current masked value.
     *
     * @returns {String}
     */
    getMaskedValue() {
        return this.state.maskedValue;
    }


    /**
     * General function used to cleanup and define the final props used for rendering
     * @returns {{ maskedValue: {String}, value: {Number}, customProps: {Object} }}
     */
    prepareProps(props) {
        let customProps = {...props}; // babeljs converts to Object.assign, then polyfills.
        delete customProps.onChange;
        delete customProps.onChangeEvent;
        delete customProps.value;
        delete customProps.decimalSeparator;
        delete customProps.thousandSeparator;
        delete customProps.precision;
        delete customProps.inputType;
        delete customProps.allowNegative;
        delete customProps.allowEmpty;
        delete customProps.prefix;
        delete customProps.suffix;
        delete customProps.selectAllOnFocus;
        delete customProps.autoFocus;

        let initialValue = props.value;
        if (initialValue === null) {
            initialValue = props.allowEmpty? null : '';
        }else{

            if (typeof initialValue == 'string') {
                // Some people, when confronted with a problem, think "I know, I'll use regular expressions."
                // Now they have two problems.

                // Strip out thousand separators, prefix, and suffix, etc.
                if (props.thousandSeparator === "."){
                    // special handle the . thousand separator
                    initialValue = initialValue.replace(/\./g, '');
                }

                if (props.decimalSeparator != "."){
                    // fix the decimal separator
                    initialValue = initialValue.replace(new RegExp(props.decimalSeparator, 'g'), '.');
                }

                //Strip out anything that is not a digit, -, or decimal separator
                initialValue = initialValue.replace(/[^0-9-.]/g, '');

                // now we can parse.
                initialValue = Number.parseFloat(initialValue);
            }
            initialValue = Number(initialValue).toLocaleString(undefined, {
                style                : 'decimal',
                minimumFractionDigits: props.precision,
                maximumFractionDigits: props.precision
            })

        }

        const { maskedValue, value } = mask(
            initialValue,
            props.precision,
            props.decimalSeparator,
            props.thousandSeparator,
            props.allowNegative,
            props.prefix,
            props.suffix
        );

        return { maskedValue, value, customProps };
    }


    /**
     * Component lifecycle function.
     * Invoked when a component is receiving new props. This method is not called for the initial render.
     *
     * @param nextProps
     * @see https://facebook.github.io/react/docs/component-specs.html#updating-componentwillreceiveprops
     */
    componentWillReceiveProps(nextProps) {
        this.setState(this.prepareProps(nextProps));
    }


    /**
     * Component lifecycle function.
     * @returns {XML}
     * @see https://facebook.github.io/react/docs/react-component.html#componentdidmount
     */
    componentDidMount(){
        let node = ReactDOM.findDOMNode(this.theInput);
        let selectionStart, selectionEnd;

        if (this.props.autoFocus) {
            this.theInput.focus();
            selectionEnd = this.state.maskedValue.length - this.props.suffix.length;
            selectionStart = selectionEnd;
        } else {
            selectionEnd = Math.min(node.selectionEnd, this.theInput.value.length - this.props.suffix.length);
            selectionStart = Math.min(node.selectionStart, selectionEnd);
        }

        this.setSelectionRange(node, selectionStart, selectionEnd);
    }

    componentWillUpdate() {
        let node = ReactDOM.findDOMNode(this.theInput);
        this.inputSelectionStart = node.selectionStart;
        this.inputSelectionEnd = node.selectionEnd;
    }


    componentDidUpdate(prevProps, prevState){
        const { decimalSeparator } = this.props;
        let node = ReactDOM.findDOMNode(this.theInput);
        let isNegative = (this.theInput.value.match(/-/g) || []).length % 2 === 1;
        let minPos = this.props.prefix.length + (isNegative ? 1 : 0);
        let selectionEnd = Math.max(minPos, Math.min(this.inputSelectionEnd, this.theInput.value.length - this.props.suffix.length));
        let selectionStart = Math.max(minPos, Math.min(this.inputSelectionEnd, selectionEnd));

        let regexEscapeRegex = /[-[\]{}()*+?.,\\^$|#\s]/g;
        let separatorsRegex = new RegExp(decimalSeparator.replace(regexEscapeRegex, '\\$&') + '|' + this.props.thousandSeparator.replace(regexEscapeRegex, '\\$&'), 'g');
        let currSeparatorCount = (this.state.maskedValue.match(separatorsRegex) || []).length;
        let prevSeparatorCount = (prevState.maskedValue.match(separatorsRegex) || []).length;
        let adjustment = Math.max(currSeparatorCount - prevSeparatorCount, 0);

        selectionEnd = selectionEnd + adjustment;
        selectionStart = selectionStart + adjustment;

        const precision = Number(this.props.precision);

        let baselength = this.props.suffix.length
            + this.props.prefix.length
            + (precision > 0 ? decimalSeparator.length : 0) // if precision is 0 there will be no decimal part
            + precision
            + 1; // This is to account for the default '0' value that comes before the decimal separator

        if (this.state.maskedValue.length == baselength){
            // if we are already at base length, position the cursor at the end.
            selectionEnd = this.theInput.value.length - this.props.suffix.length;
            selectionStart = selectionEnd;
        }

        this.setSelectionRange(node, selectionStart, selectionEnd);
        this.inputSelectionStart = selectionStart;
        this.inputSelectionEnd = selectionEnd;
    }

    setSelectionRange(node, start, end) {
      if (document.activeElement === node) {
        node.setSelectionRange(start, end);
      }
    }

    formatInput = (stringValue = '') => {
        if (typeof stringValue === 'number') stringValue+=''
        if (stringValue.length == 0) return { floatValue: 0, formattedValue: ''}
        const {decimalSeparator, thousandSeparator, allowNegative, prefix, suffix, precision} = this.props
        const hasNagation =  stringValue[0] === '-'
        stringValue = stringValue.replace('-', '');
        let lastIsDecimal = stringValue[stringValue.length - 1] === decimalSeparator
        let parts = stringValue.replace(new RegExp('\\' + decimalSeparator), '&&').split('&&');
        let beforeDecimal = ((parts[0] || '').match(/\d/g) || []).join('').trim().replace(/^0+/,'') || '0';
        let afterDecimal = ((parts[1] || '').match(/\d/g) || []).join('').trim()
      
    
        if (precision && precision > 0) {
          afterDecimal = afterDecimal.length > precision ? afterDecimal.slice(0,precision) : afterDecimal
          // const roundValue = Number('0.' + afterDecimal).toFixed(precision).split('.')
          // afterDecimal = roundValue[1] || ''
        } 
        const floatValue =Number( (hasNagation? '-' : '') + beforeDecimal + (afterDecimal? decimalSeparator + afterDecimal : '' ))
        beforeDecimal = beforeDecimal.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + thousandSeparator) 
        const formattedValue = (hasNagation? '-' : '') + beforeDecimal + (afterDecimal || lastIsDecimal? decimalSeparator + afterDecimal : '' )
        return {floatValue, formattedValue}
    }

    handleChange = (event) => {
        event.preventDefault();
        let { maskedValue, value } = this.formatInput(event.target.value);

        event.persist();  // fixes issue #23

        this.setState({ maskedValue, value }, () => {
            this.props.onChange(maskedValue, value, event);
            this.props.onChangeEvent(event, maskedValue, value);
        });
    }

    handleFocus = (event) => {
        if (!this.theInput) return;
        let selectionEnd = this.theInput.value.length - this.props.suffix.length;
        let isNegative = (this.theInput.value.match(/-/g) || []).length % 2 === 1;
        let selectionStart = this.props.prefix.length + (isNegative ? 1 : 0);
        this.props.selectAllOnFocus && event.target.setSelectionRange(selectionStart, selectionEnd);
        this.inputSelectionStart = selectionStart;
        this.inputSelectionEnd = selectionEnd;
    }


    handleOnBlur = (event) => {
        const { onBlur} = this.props
        this.inputSelectionStart = 0;
        this.inputSelectionEnd = 0;
        onBlur && onBlur(event)
    }

    handleKeyDown = event => {
        const { onKeyDown} = this.props
        const {key, keyCode} = event
        this.activeKey = key
        onKeyDown && onKeyDown(event)
    }

    render() {
        return (
            <input
                ref={(input) => { this.theInput = input; }}
                type={this.props.inputType}
                value={this.state.maskedValue}
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                onFocus={this.handleFocus}
                onMouseUp={this.handleFocus}
                onblur={this.handleOnBlur}
                {...this.state.customProps}
            />
        )
    }
}


NumberInput2.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    decimalSeparator: PropTypes.string,
    thousandSeparator: PropTypes.string,
    precision: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    inputType: PropTypes.string,
    allowNegative: PropTypes.bool,
    allowEmpty: PropTypes.bool,
    prefix: PropTypes.string,
    suffix: PropTypes.string,
    selectAllOnFocus: PropTypes.bool
};


NumberInput2.defaultProps = {
    onChange: function(maskValue, value, event) {/*no-op*/},
    onChangeEvent: function(event, maskValue, value) {/*no-op*/},
    autoFocus: false,
    value: '0',
    decimalSeparator: '.',
    thousandSeparator: ',',
    precision: '2',
    inputType: 'text',
    allowNegative: false,
    prefix: '',
    suffix: '',
    selectAllOnFocus: false
};


export default NumberInput2
