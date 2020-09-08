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
  
  const [dataValue, setDataValue] = React.useState({formattedValue: '', floatValue: null, caretPos: 1});
  const inputRef = React.useRef(null)
  const valueRef = React.useRef({})
  //Initial data
  React.useEffect(() => {
    if (thousandSeparator === decimalSeparator)
    throw new Error("Decimal separator can't be same as thousand separator.");
  }, [thousandSeparator, decimalSeparator]);

  React.useEffect(() => {
    if (!inputRef.current) return
    inputRef.current.setSelectionRange(dataValue.caretPos, dataValue.caretPos)
  });

  const formatNumberString = (stringValue = '', selectionStart, selectionEnd) => {
    if (!stringValue || stringValue.length == 0) return {formattedValue: '', floatValue : null}
    const negativeCount =  (stringValue.match(/-/g) || []).length
    const hasDecimalSeparator = stringValue.indexOf(decimalSeparator) !== -1
    const parts = stringValue.replace(new RegExp('\\' + decimalSeparator), '&&').split('&&');
    let beforeDecimal = ((parts[0] || '').match(/\d/g) || []).join('').trim()
    let afterDecimal =  ((parts[1] || '').match(/\d/g) || []).join('').trim()
    //handle beforeDecimal
    let numberIndex = beforeDecimal.search(/[1-9]/)
    beforeDecimal = beforeDecimal.split('')
    if (numberIndex >= 0) {
      for (let x= beforeDecimal.length - 3; x > numberIndex + 0; x = x - 3) {
        beforeDecimal.splice(x, 0, thousandSeparator);
      }
    }
    if (negativeCount === 1) beforeDecimal.unshift('-')
    //handle afterDecimal
    if (hasDecimalSeparator) afterDecimal = decimalSeparator + afterDecimal
     return {
      formattedValue: beforeDecimal.join('').replace(/^0+\,/) + afterDecimal,
      floatValue: Number((beforeDecimal + afterDecimal).replace(new RegExp('\\' + thousandSeparator, 'g'),'').replace(new RegExp('\\' + decimalSeparator),'.'))
     } 
  }

  const correctNumberString = (stringValue) => {
    if (stringValue === undefined || stringValue === null || stringValue.length === 0) return ''
    const parts = stringValue.replace(new RegExp('\\' + decimalSeparator), '&&').split('&&');
    let beforeDecimal = (parts[0].replace(/^0+/,'') || '0')
    let afterDecimal =  ((parts[1] || '').match(/\d/g) || []).join('').trim()
    if (precision !== undefined) {
      const roundValue = Number('0.' + afterDecimal).toFixed(precision).split('.')
      afterDecimal = roundValue[1] || ''
    } 
    return beforeDecimal + decimalSeparator + afterDecimal
  }

  function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

  const getCaretPosition = (prevValue = '', inputValue = '',formattedValue, {start, end}) => {
    if (!inputValue) return 0
    let currSeparatorCount, prevSeparatorCount;
    let adjustment = 0
    let separatorsRegex = new RegExp('\\' + thousandSeparator, 'g')
    const charUpdateLength = inputValue.length - prevValue.length
    currSeparatorCount = (formattedValue.match(separatorsRegex) || []).length;
    prevSeparatorCount = (inputValue.match(separatorsRegex) || []).length;
    if (charUpdateLength > 0) {
      adjustment = clamp(currSeparatorCount - prevSeparatorCount, 0, 1);
    } else if (charUpdateLength < 0) {
      const {keyCode} = valueRef.current
      const charAt = formattedValue[start]
      adjustment = clamp(currSeparatorCount - prevSeparatorCount, -1, 0);
      //Handle delete key
      if (keyCode && keyCode === 46 && separatorsRegex.test(charAt)){
        adjustment = adjustment + 1
      }
    }
    const hasNegation = formattedValue[0] === '-';
    return clamp(start + adjustment, (hasNegation ? 2 : 1), formattedValue.length);
  }

  const handleKeyDown = (event) => {
    const {keyCode} = event
    if (valueRef.current) {
      valueRef.current.keyCode = keyCode
    }
    onKeyDown && onKeyDown(event)
  };

  const handleChange = (event) => {
    const element = event.target
    const {value, selectionStart, selectionEnd} = element
    const {formattedValue, floatValue} = formatNumberString(value, selectionStart, selectionEnd)
    const caretPos = getCaretPosition(dataValue.formattedValue,value,formattedValue,  {start: selectionStart, end:selectionEnd})
    setDataValue(prev => ({...prev, caretPos}))
    if (dataValue.formattedValue !== formattedValue) {
      setDataValue(prev => ({...prev,formattedValue, floatValue}))
      onValueChange && onValueChange({formattedValue, floatValue})
    }
    onChange && onChange(event)
  };


  const handleOnBlur = (event) => {
    const formattedValue = correctNumberString(event.target.value)
    setDataValue(prev => ({...prev,formattedValue}))
    onBlur &&  onBlur(event)
  };

  const handleFocus = (event) => {
   
  };
  
  return (
    <input
      ref={inputRef}
      onChange={handleChange}
      onFocus={handleFocus}
      onMouseUp={handleFocus}
      onKeyDown={handleKeyDown}
      onBlur={handleOnBlur}
      value={dataValue.formattedValue}
      {...other}
    />
  );
});

export default NumberInput;
