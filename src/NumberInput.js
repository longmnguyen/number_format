import React from "react";

const NumberInput = React.memo(props => {
    const {
        value,
        precision = 2,
        thousandSeparator = ',',
        decimalSeparator = '.',
        roundDecimal = false,
        allowsNegative = true,
        prefix = '',
        suffix = '',
        nullValue,
        onValueChange,
        onChange,
        onBlur,
        onKeyDown,
        ...other
    } = props
    const [dataValue, setDataValue] = React.useState({
        formattedValue: '',
        floatValue: null,
        caretPos: 1
    })
    const inputRef = React.useRef(null)
    const valueRef = React.useRef({})
    //Initial data
    React.useEffect(() => {
        if (thousandSeparator === decimalSeparator)
            throw new Error("Decimal separator can't be same as thousand separator.")
    }, [thousandSeparator, decimalSeparator])
    //handle value prop change
    React.useEffect(() => {
        let update = value
        if (!update && update !== 0) {
            update = nullValue !== undefined ? nullValue : ''
        } else {
            if (typeof update === 'string') {
                if (thousandSeparator) {
                    update = update.replace(new RegExp(thousandSeparator, 'g'), '')
                }
                update = update.replace(/[^0-9-.]/g, '')
                if (update || update === '0') {
                    if (precision !== undefined) {
                        update = Number(update).toFixed(precision)
                    }
                    update = Number.parseFloat(update)
                }
            }
        }
        if (dataValue.floatValue !== update) {
            let { formattedValue, floatValue } = formatNumberString(update)
            formattedValue = correctNumberString(formattedValue)
            setDataValue(prev => ({ ...prev, formattedValue, floatValue }))
        }
    }, [value, precision, thousandSeparator])

    React.useEffect(() => {
        if (!inputRef.current) return
        inputRef.current.setSelectionRange(dataValue.caretPos, dataValue.caretPos)
    }, [inputRef.current, dataValue])

    const getFloatValue = stringValue => {
        if (!stringValue || stringValue.length == 0) return null
        stringValue = stringValue
            .replace(new RegExp('\\' + thousandSeparator, 'g'), '')
            .replace(new RegExp('\\' + decimalSeparator), '.')
        if (prefix.length > 0) {
            let prefixRegex = new RegExp('\\' + prefix)
            stringValue = prefixRegex.test(stringValue)
                ? stringValue.replace(prefixRegex, '')
                : stringValue
        }
        if (suffix.length > 0) {
            let suffixRegex = new RegExp('\\' + suffix)
            stringValue = suffixRegex.test(stringValue)
                ? stringValue.replace(suffixRegex, '')
                : stringValue
        }
        if (precision !== undefined) {
            stringValue = Number(stringValue).toFixed(precision)
        }
        return Number(stringValue)
    }

    const formatNumberString = stringValue => {
        if (!stringValue && stringValue !== 0) {
            return { formattedValue: nullValue !== undefined ? nullValue : '', floatValue: null }
        }
        if (typeof stringValue === 'number') stringValue = '' + stringValue
        const negativeCount = (stringValue.match(/-/g) || []).length
        const hasDecimalSeparator = stringValue.indexOf(decimalSeparator) !== -1
        const parts = stringValue.replace(new RegExp('\\' + decimalSeparator), '&&').split('&&')
        let beforeDecimal = ((parts[0] || '').match(/\d/g) || []).join('').trim()
        let afterDecimal = ((parts[1] || '').match(/\d/g) || []).join('').trim()
        if (
            !beforeDecimal &&
            !afterDecimal &&
            prefix.length > 0 &&
            !new RegExp('\\' + prefix).test(stringValue)
        )
            return { formattedValue: nullValue !== undefined ? nullValue : '', floatValue: null }
        //handle beforeDecimal
        let numberIndex = beforeDecimal.search(/[1-9]/)
        beforeDecimal = beforeDecimal.split('')
        if (numberIndex >= 0) {
            for (let x = beforeDecimal.length - 3; x > numberIndex + 0; x = x - 3) {
                beforeDecimal.splice(x, 0, thousandSeparator)
            }
        }
        if (prefix.length > 0) beforeDecimal.unshift(prefix)
        if (negativeCount === 1 && allowsNegative) beforeDecimal.unshift('-')
        //handle afterDecimal
        if (precision) {
            afterDecimal = afterDecimal && afterDecimal.substring(0, precision)
            if (hasDecimalSeparator) afterDecimal = decimalSeparator + afterDecimal
        }
        if (suffix.length > 0) afterDecimal = afterDecimal + suffix
        return {
            formattedValue: beforeDecimal.join('').replace(/^0+\,/) + afterDecimal,
            floatValue: getFloatValue(beforeDecimal + afterDecimal)
        }
    }

    const correctNumberString = stringValue => {
        if (!stringValue && stringValue !== 0) {
            return nullValue !== undefined ? nullValue : ''
        }
        if (prefix.length > 0) {
            stringValue = stringValue.replace(new RegExp('\\' + prefix), '')
        }
        if (suffix.length > 0) {
            stringValue = stringValue.replace(new RegExp('\\' + suffix), '')
        }
        const hasNegation = /-/g.test(stringValue)
        if (hasNegation) {
            stringValue = stringValue.replace(/-/, '')
        }
        const parts = stringValue.replace(new RegExp('\\' + decimalSeparator), '&&').split('&&')
        let beforeDecimal = parts[0].replace(/^0+/, '') || '0'
        let afterDecimal = ((parts[1] || '').match(/\d/g) || []).join('').trim()

        if (precision !== undefined) {
            const roundValue = Number('0.' + afterDecimal)
                .toFixed(precision)
                .split('.')
            afterDecimal = roundValue[1] || ''
        }
        const isZero =
            /^0+$/.test(beforeDecimal) && (afterDecimal.length === 0 || /^0+$/.test(afterDecimal))
        if (prefix.length > 0) beforeDecimal = prefix + beforeDecimal
        if (hasNegation && !isZero && allowsNegative) beforeDecimal = '-' + beforeDecimal
        if (afterDecimal.length) afterDecimal = decimalSeparator + afterDecimal
        if (suffix.length) afterDecimal = afterDecimal + suffix
        return beforeDecimal + afterDecimal
    }

    function clamp(num, min, max) {
        return Math.min(Math.max(num, min), max)
    }

    const getCaretPosition = (prevValue = '', inputValue = '', formattedValue, { start, end }) => {
        if (!inputValue) return 0
        let currSeparatorCount, prevSeparatorCount
        let adjustment = 0
        let separatorsRegex = new RegExp('\\' + thousandSeparator, 'g')
        const charUpdateLength = inputValue.length - prevValue.length
        currSeparatorCount = (formattedValue.match(separatorsRegex) || []).length
        prevSeparatorCount = (inputValue.match(separatorsRegex) || []).length
        if (charUpdateLength > 0) {
            adjustment = clamp(currSeparatorCount - prevSeparatorCount, 0, 1)
        } else if (charUpdateLength < 0) {
            const { keyCode } = valueRef.current
            const charAt = formattedValue[start]
            adjustment = clamp(currSeparatorCount - prevSeparatorCount, -1, 0)
            //Handle delete key
            if (keyCode && keyCode === 46 && separatorsRegex.test(charAt)) {
                adjustment = adjustment + 1
            }
        }
        const hasNegation = formattedValue[0] === '-'
        return clamp(
            start + adjustment,
            (hasNegation ? 1 : 0) + prefix.length,
            formattedValue.length - suffix.length
        )
    }

    const handleKeyDown = event => {
        const { keyCode } = event

        if (valueRef.current) {
            valueRef.current.keyCode = keyCode
        }
        onKeyDown && onKeyDown(event)
    }

    const handleChange = event => {
        const element = event.target
        const { value, selectionStart, selectionEnd } = element
        const { formattedValue, floatValue } = formatNumberString(value)
        const caretPos = getCaretPosition(dataValue.formattedValue, value, formattedValue, {
            start: selectionStart,
            end: selectionEnd
        })
        setDataValue(prev => ({ ...prev, caretPos }))
        if (dataValue.formattedValue !== formattedValue) {
            setDataValue(prev => ({ ...prev, formattedValue, floatValue }))
            onValueChange && onValueChange({ formattedValue, floatValue })
        }
        onChange && onChange(event)
    }

    const handleOnBlur = event => {
        const formattedValue = correctNumberString(dataValue.formattedValue)
        const floatValue = getFloatValue(formattedValue)
        if (formattedValue !== dataValue.formattedValue) {
            setDataValue(prev => ({ ...prev, formattedValue, floatValue }))
        }
        onBlur && onBlur(event)
    }

    return (
        <input
            ref={inputRef}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleOnBlur}
            value={dataValue.formattedValue}
            {...other}
        />
    )
})

export default NumberInput;
