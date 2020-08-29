import React from "react";
import { valuesIn } from "lodash";

const usePreviousValue = (value) => {
  const prevValue = React.useRef();

  React.useEffect(() => {
    prevValue.current = value;

    return () => {
      prevValue.current = undefined;
    };
  });

  return prevValue.current;
};

const NumberInput = React.memo((props) => {
  const DEFAULT_OPTIONS = {
    format: "0,0",
    ts: ",",
    ds: ".",
    roundDecimal: true,
  };
  const {
    value = "",
    precision = 0,
    thousandSeparator = ",",
    decimalSeparator = ".",
    roundDecimal = true,
    prefix = '',
    suffix = '',
    allowNegative = true,
    onChange,
    onBlur,
    onKeyDown,
    ...other
  } = props;
  
  const [inputValue, setInputValue] = React.useState("");
  const [floatValue, setFloatValue] = React.useState(0);
  const inputRef = React.useRef(null)
  const valueRef = React.useRef()
  //Initial data
  React.useEffect(() => {
    if (!valueRef.current) valueRef.current = {}
    valueRef.current.selectionRange = {selectionStart: 1, selectionEnd: 1}
    valueRef.current.prevInputValue = ''
    return () => valueRef.current = undefined
  }, []);
  //Update input value if props value change
  React.useEffect(() => {
    let initialValue = value;
    if (initialValue == null){
      initialValue = 0
    } else {
      if (typeof value === 'string') {
        const hasNagation = value[0] === '-';
        let checkValue = value.replace('-', '');
        let parts = checkValue.replace(new RegExp('\\' + decimalSeparator), '&&').split('&&');
        let beforeDecimal = ((parts[0] || '').match(/\d/g) || []).join('').trim().replace(/^0+/,'') || '0';
        let afterDecimal = ((parts[1] || '').match(/\d/g) || []).join('').trim()
        if (precision && precision > 0) {
          afterDecimal = afterDecimal.length > precision ? afterDecimal.slice(0,precision) : afterDecimal
          const roundValue = Number('0.' + afterDecimal).toFixed(precision).split('.')
          afterDecimal = roundValue[1] || ''
        } 
        initialValue = Number( (hasNagation? '-' : '') + beforeDecimal + (afterDecimal? decimalSeparator + afterDecimal : '' ))
      }
    }
    if (initialValue != floatValue) {
      const {floatValue, formattedValue} = formatInput(initialValue)
      setInputValue(formattedValue)
    }
  }, [value]);

  React.useEffect(() => {
    let ts = thousandSeparator || "";
    let ds = decimalSeparator || DEFAULT_OPTIONS.ds;
    if (ts === ds)
      throw new Error("ThousandSeparator and DecimalSeparator cannot be same");
  }, [thousandSeparator, decimalSeparator]);

  // React.useEffect(() => {
  //   if (!inputRef.current || !valueRef.current) return
  //   const {selectionRange, prevInputValue, key} = valueRef.current;
  //   const formattedValue =  inputRef.current.value
  //   let expectedCaretPosition = {...selectionRange}

  //   if (selectionRange.selectionStart === 0 || !formattedValue.length) {
  //     expectedCaretPosition= {selectionStart: 0, selectionEnd: 0}
  //   } else {
  //     const editLength = formattedValue.length - prevInputValue.length
  //     const isAddition = editLength > 0
  //     const isFirstRawValue = prevInputValue.length === 0
  //     const hasNagation =  inputRef.current.value[0] === '-'
  //     let minPos = prefix.length + (hasNagation ? 1 : 0);
  //     let selectionEnd = Math.max(minPos, Math.min(selectionRange.selectionEnd, inputRef.current.value.length - suffix.length));
  //     let selectionStart = Math.max(minPos, Math.min(selectionRange.selectionEnd, selectionEnd));
    
  //     let regexEscapeRegex = /[-[\]{}()*+?.,\\^$|#\s]/g;
  //     let separatorsRegex = new RegExp(thousandSeparator.replace(regexEscapeRegex, '\\$&'), 'g');
  //     if (key === 'Delete' && separatorsRegex.test(prevInputValue[selectionStart])) {
  //       expectedCaretPosition.selectionStart++
  //       expectedCaretPosition.selectionEnd++
  //     }
  //     let currSeparatorCount = (inputRef.current.value.match(separatorsRegex) || []).length
  //     let prevSeparatorCount = (prevInputValue.match(separatorsRegex) || []).length;
  //     let adjustment = currSeparatorCount - prevSeparatorCount >= 1 ? 1 : currSeparatorCount - prevSeparatorCount <= -1 ? -1 : 0
  //     expectedCaretPosition.selectionStart = Math.min(Math.max(expectedCaretPosition.selectionStart + adjustment, 0), inputRef.current.value.length)
  //     expectedCaretPosition.selectionEnd = Math.min(Math.max(expectedCaretPosition.selectionEnd + adjustment, 0), inputRef.current.value.length)
      
  //     if ((hasNagation && inputRef.current.value.length === 2) || (inputRef.current.value.length === 1 && !hasNagation)) {
  //       expectedCaretPosition.selectionStart = 1
  //       expectedCaretPosition.selectionEnd = 1
  //     }
  //   }
  //   setCaretPosition(inputRef.current, expectedCaretPosition.selectionStart, expectedCaretPosition.selectionEnd)
  // }, [valueRef.current, inputRef.current]);
  React.useEffect(() => {
    if (!inputRef.current || !valueRef.current) return
    const {selectionRange, prevInputValue, key} = valueRef.current;
    const formattedValue =  inputRef.current.value
    let expectedCaretPosition = selectionRange.selectionStart
    let regexEscapeRegex = /[-[\]{}()*+?.,\\^$|#\s]/g;
    let separatorsRegex = new RegExp(thousandSeparator.replace(regexEscapeRegex, '\\$&'), 'g');
    let currSeparatorCount = (inputRef.current.value.match(separatorsRegex) || []).length
    let prevSeparatorCount = (prevInputValue.match(separatorsRegex) || []).length;
 
    let adjustment = Math.max(currSeparatorCount - prevSeparatorCount, 0);
    
    if (key === 'Delete' && separatorsRegex.test(prevInputValue[expectedCaretPosition])) {
      expectedCaretPosition++
    }
    expectedCaretPosition= Math.min(Math.max(expectedCaretPosition + adjustment, 0), formattedValue.length)
 
    setCaretPosition(inputRef.current, expectedCaretPosition, expectedCaretPosition)
  }, [inputRef.current, valueRef.current, thousandSeparator]);

  const formatInputbk = (stringValue = '') => {
    if (typeof stringValue === 'number') stringValue+=''
    if (stringValue.length == 0) return { floatValue: 0, formattedValue: ''}
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

  const formatInput = (stringValue = '') => {
    if (typeof stringValue === 'number') stringValue+=''
    if (stringValue.length == 0) return { floatValue: 0, formattedValue: ''}
    const hasNagation =  stringValue[0] === '-'
    const hasDecimalSeparator = stringValue.indexOf('.') !== -1
    let parts = stringValue.replace(new RegExp('\\' + decimalSeparator), '&&').split('&&');
    let beforeDecimal = ((parts[0] || '').match(/\d/g) || []).join('').trim().replace(/^0+/,'') || '0';
    let afterDecimal = ((parts[1] || '').match(/\d/g) || []).join('').trim()
  

    if (precision && precision > 0) {
      afterDecimal = afterDecimal.length > precision ? afterDecimal.slice(0,precision) : afterDecimal
      // const roundValue = Number('0.' + afterDecimal).toFixed(precision).split('.')
      // afterDecimal = roundValue[1] || ''
    } 
    const floatValue = Number( (hasNagation? '-' : '') + beforeDecimal + (afterDecimal? decimalSeparator + afterDecimal : '' ))
  
    // add in any thousand separators
    beforeDecimal = beforeDecimal.split('')
    for (let x= beforeDecimal.length - 3; x > 0; x = x - 3) {
      beforeDecimal.splice(x, 0, thousandSeparator);
    }
    // if we have a prefix or suffix, add them in.
    if (prefix) { beforeDecimal.unshift(prefix); }
    if (suffix) { afterDecimal += suffix}
    const formattedValue = (hasNagation? '-' : '') + beforeDecimal.join('') + (hasDecimalSeparator && decimalSeparator || '') + afterDecimal
    return {floatValue, formattedValue}
  }

  const handleKeyDown = (event) => {
    const {key, keyCode} = event
    valueRef.current = {...valueRef.current, key}
    onKeyDown && onKeyDown(event)
  };

  const handleChange = (event) => {
    event.persist();
    const {selectionStart, selectionEnd} = event.target;
    const editLength = event.target.value.length - inputValue.length
    const {floatValue, formattedValue} = formatInput(event.target.value)
    setInputValue(val => {
      valueRef.current = {...valueRef.current,editLength, prevInputValue: val, selectionRange: {selectionStart, selectionEnd}}
      return formattedValue
    })
    
    setFloatValue(floatValue)
    onChange && onChange(floatValue)
  };

  const handleOnBlur = (event) => {
    let parts = inputValue.replace(new RegExp('\\' + decimalSeparator), '&&').split('&&');
    let beforeDecimal = parts[0]
    let afterDecimal = ((parts[1] || '').match(/\d/g) || []).join('').trim()
    if (precision && precision > 0) {
      afterDecimal = afterDecimal.length > precision ? afterDecimal.slice(0,precision) : afterDecimal
      const roundValue = Number('0.' + afterDecimal).toFixed(precision).split('.')
      afterDecimal = roundValue[1] || ''
    } 
    const hasNagation = inputValue[0] === '-';
    const lastIsDecimal =  inputValue[ inputValue - 1] === decimalSeparator
    const formattedValue = (hasNagation? '-' : '') + beforeDecimal + (afterDecimal || lastIsDecimal? decimalSeparator + afterDecimal : '' )
    setInputValue(formattedValue)
    onBlur && onBlur(event)
  };

  const handleFocus = (event) => {
    if (!inputRef.current) return;
    // let selectionEnd = inputRef.current.value.length - suffix.length;
    // let isNegative = inputRef.current.value[0] === '-'
    // let selectionStart = prefix.length + (isNegative ? 1 : 0);
    // setTimeout(() => {
    //   valueRef.current = {...valueRef.current,focusRange: {start: event.target.selectionStart, end: event.target.selectionEnd}}
    // }, 0);
    
   
  };

  const setCaretPosition = (element, start, end) => {
    if (document.activeElement === element) {
      element.setSelectionRange(start, end);
    }
  }

  return (
    <input
    id="hi"
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
