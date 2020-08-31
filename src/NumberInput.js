import React from "react";

const NumberInput = React.memo((props) => {
  const {
    value = "",
    precision = 2,
    thousandSeparator = ",",
    decimalSeparator = ".",
    roundDecimal = false,
    prefix = '',
    suffix = '',
    allowNegative = true,
    onValueChange,
    onChange,
    onBlur,
    onKeyDown,
    ...other
  } = props;
  
  const [inputValue, setInputValue] = React.useState("");
  const [floatValue, setFloatValue] = React.useState();
  const inputRef = React.useRef(null)
  const valueRef = React.useRef({})
  //Initial data
  React.useEffect(() => {
    if (thousandSeparator === decimalSeparator)
    throw new Error("Decimal separator can't be same as thousand separator.");
    return () => valueRef.current = undefined
  }, [thousandSeparator, decimalSeparator]);
  //Update value props change
  React.useEffect(() => {
    let checkValue = value
    if (checkValue === null) checkValue = ''
    if (typeof checkValue === 'number') {
      if (checkValue !== floatValue) {
        const {_, formattedValue} = formatInput(checkValue, true)
        setInputValue(formattedValue)
      }
    } else if (typeof checkValue === 'string') {
      const {_, formattedValue} = formatInput(checkValue, true)
      if (formattedValue !== inputValue) {
        setInputValue(formattedValue)
      }
    }
  }, [value]);
  // Control cursor postion
  React.useEffect(() => {
    if (!inputRef.current || !valueRef.current) return
    const { key} = valueRef.current;
    let regexEscapeRegex = /[-[\]{}()*+?.,\\^$|#\s]/g;
    let separatorsRegex =  new RegExp(decimalSeparator.replace(regexEscapeRegex, '\\$&') + '|' + thousandSeparator.replace(regexEscapeRegex, '\\$&'), 'g');
    let expectedCaretPosition = valueRef.current.caretPos
    if (key === 'Delete' && separatorsRegex.test(inputValue[expectedCaretPosition])) {
      expectedCaretPosition++
    }
    inputRef.current.setSelectionRange(expectedCaretPosition, expectedCaretPosition);
  }, [inputRef.current, valueRef.current.caretPos, valueRef.current.key, thousandSeparator, decimalSeparator]);

  const formatInput = (stringValue, fixedDecimalScale = false, isRemoveCharacter) => {
    if (stringValue === null || stringValue.length === 0)  return {floatValue: null, formattedValue: ''}
    if (isRemoveCharacter) stringValue = inputValue
    if (typeof stringValue === 'number') stringValue += ''
    const hasNagation =  (stringValue.match(/-/g) || []).length > 0
    const hasDecimalSeparator = stringValue.indexOf(decimalSeparator) !== -1 || (precision && roundDecimal);
    let parts = stringValue.replace(new RegExp('\\' + decimalSeparator), '&&').split('&&');
    let beforeDecimal = ((parts[0] || '').match(/\d/g) || []).join('').trim()
    let afterDecimal = ((parts[1] || '').match(/\d/g) || []).join('').trim()
    if (precision !== null) {
      afterDecimal = afterDecimal.length > precision ? afterDecimal.slice(0,precision) : afterDecimal
      if (fixedDecimalScale || roundDecimal) {
        const roundValue = Number('0.' + afterDecimal).toFixed(precision).split('.')
        afterDecimal = roundValue[1] || ''
      }
    } 
    if ((beforeDecimal.length === 0  && afterDecimal.length === 0) ||  (beforeDecimal.length === 0 && /^0+$/.test(afterDecimal))) {
      return {floatValue: null, formattedValue: ''}
    }
    afterDecimal = afterDecimal || hasDecimalSeparator? decimalSeparator + afterDecimal : ''
    const floatValue = Number( (allowNegative && hasNagation? '-' : '') + beforeDecimal + afterDecimal)
    beforeDecimal = (beforeDecimal.replace(/^0+/,'') || '0').split('')
    for (let x= beforeDecimal.length - 3; x > 0; x = x - 3) {
      beforeDecimal.splice(x, 0, thousandSeparator);
    }
    if (prefix) { beforeDecimal.unshift(prefix); }
    if (allowNegative && hasNagation) { beforeDecimal.unshift('-'); }
    if (suffix) { afterDecimal += suffix}
    const formattedValue = beforeDecimal.join('') + afterDecimal
    return {floatValue, formattedValue}
  }

  const getCurrentCaretPosition = (target, inputvalue, formatvalue) => {
    const currentCaretPosition = Math.max(target.selectionStart, target.selectionEnd);
    return getCaretPosition(inputvalue,  formatvalue, currentCaretPosition);
  }

  const getCaretPosition = (inputValue ='', formattedValue = '', caretPos) => {
    const inputNumber = (inputValue.match(/\d/g) || []).join('');
    const formattedNumber = (formattedValue.match(/\d/g) || []).join('');
    let j, i;
    j = 0;
    for(i=0; i<caretPos; i++){
      const currentInputChar = inputValue[i] || '';
      const currentFormatChar = formattedValue[j] || '';
      //no need to increase new cursor position if formatted value does not have those characters
      //case inputValue = 1a23 and formattedValue =  123
      if(!currentInputChar.match(/\d/g) && currentInputChar !== currentFormatChar) continue;
      //When we are striping out leading zeros maintain the new cursor position
      //Case inputValue = 00023 and formattedValue = 23;
      if (currentInputChar === '0' && currentFormatChar.match(/\d/g) && currentFormatChar !== '0' && inputNumber.length !== formattedNumber.length) continue;
      //we are not using currentFormatChar because j can change here
      while(currentInputChar !== formattedValue[j] && j < formattedValue.length) j++;
      j++;
    }
    //correct caret position if its outside of editable area
    j = correctCaretPosition(formattedValue, j);
    return j;
  }

  const correctCaretPosition = (value, caretPos, direction = false) => {
    if (value === '') return 0;
    //caret position should be between 0 and value length
    caretPos =  Math.min(Math.max(caretPos, 0), value.length);
    //in case of format as number limit between prefix and suffix
    const hasNegation = value[0] === '-';
    return Math.min(Math.max(caretPos,  prefix.length + (hasNegation ? 1 : 0)), value.length - suffix.length);
  }

  const setCaretPosition = (element, caretpos) => {
    if (document.activeElement === element) {
      element.setSelectionRange(caretpos, caretpos);
    }
  }

  const handleKeyDown = (event) => {
    const {key} = event
    valueRef.current = {...valueRef.current, key}
    onKeyDown && onKeyDown(event)
  };

  const handleChange = (event) => {
    event.persist();
    const {selectionStart, selectionEnd} = event.target;
    let isRemoveAtCharacter = false
    const isDelete = event.target.value.length - inputValue.length  < 0
    if (isDelete && [decimalSeparator].indexOf(inputValue[selectionStart]) > -1)  isRemoveAtCharacter = true
    const {floatValue, formattedValue} = formatInput(event.target.value, false, isRemoveAtCharacter)
    const caretPos = getCurrentCaretPosition(event.target, event.target.value ,formattedValue)
    valueRef.current.caretPos = caretPos
    if (inputValue !== formattedValue) {
      setInputValue(val => {
        valueRef.current = {...valueRef.current,
          caretPos
        }
      
        return formattedValue
      })
      onValueChange && onValueChange({floatValue, formattedValue})
    }
    setFloatValue(floatValue)
    onChange && onChange(floatValue)
  };


  const handleOnBlur = (event) => {
    const {_, formattedValue} = formatInput(inputValue, true)
    setInputValue(formattedValue)
    onBlur && onBlur(event)
  };

  const handleFocus = (event) => {
    if (!inputRef.current) return
    const {selectionStart, selectionEnd, value} = inputRef.current
    let caretpos = selectionStart
    // in case: outside prefix and subfix
    if (selectionStart === selectionEnd) {
      if (selectionStart === 0 && prefix) caretpos++
      if (selectionStart === inputRef.current.length && suffix) caretpos--
      setCaretPosition(inputRef.current, caretpos, caretpos)
    }
  };
  
  return (
    <input
      ref={inputRef}
      onChange={handleChange}
      onFocus={handleFocus}
      onMouseUp={handleFocus}
      onKeyDown={handleKeyDown}
      onBlur={handleOnBlur}
      value={inputValue}
      {...other}
    />
  );
});

export default NumberInput;
