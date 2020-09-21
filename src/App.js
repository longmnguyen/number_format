import React from 'react';
import NumberInput from './NumberInput'

import NumberPlugin from './NumberPlugin';
import CurrencyInput from './numberCurrency'
import AutoNumeric from './numericformat'


const Test = () => {
  
  const inpput = React.useRef()
  React.useEffect(() => {
    if (inpput.current) {
      const element = new AutoNumeric(inpput.current);
    }
   
  }, [])
  return (<input ref={inpput}/>)
}
const MainContext = React.createContext(null);

const initialState = {count: 0};

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {count: action.payload};
    case 'decrement':
      return {count: state.count - 1};
    default:
      throw new Error();
  }
}

function MainProvider (props)  {
  const [state, dispatch] = React.useReducer(reducer, initialState);
    return (
      <MainContext.Provider value={{state, dispatch}}>
        {props.children}
      </MainContext.Provider>
    );
}


const DEFAULT_CONFIG = {
  precision: 3,
  thousandSeparator: ',',
  decimalSeparator: '.',
  round: true,
  valuenumber: 200022300.5001
}

const App =() =>(
  <MainProvider>
      <Body />
  </MainProvider>)


function Body() {
  const { state, dispatch }  = React.useContext(MainContext);
  const {count} = state
  DEFAULT_CONFIG.valuenumber = count
  const [config, setconfig] = React.useState(DEFAULT_CONFIG)
  const [result, setResult] = React.useState('100')
  const onSubmit = event => {
    event.preventDefault();
    const precision = Number(event.target.precision.value)
    const thousandSeparator = event.target.thousandSeparator.value
    const decimalSeparator = event.target.decimalSeparator.value
    const round = event.target.round.value === 'true' ? true : false
    const valuenumber = event.target.valuenumber.value
    setconfig({valuenumber,precision,thousandSeparator, decimalSeparator, round})
  }
  const onValueChange = ({floatValue}) => {
    console.log(`===floatValue`,floatValue)
    let update = {...config}
    update.valuenumber = floatValue
    setconfig(update)
    dispatch({type:'increment', payload: floatValue})
  }

  return (
    <div style={styles.container}>
    
      <div style={styles.body}>

     
      <form onSubmit={onSubmit} style={styles.form}>
        <h3>Number configs:</h3>
        <div  style={styles.input}>
            <label style={{width: 150}}>Value</label>
            <input style={{flex: 1}} name="valuenumber" defaultValue={config.valuenumber}/>
        </div>
        <div  style={styles.input}>
            <label style={{width: 150}}>Precision</label>
            <input style={{flex: 1}} name="precision" defaultValue={config.precision} type="number"/>
        </div>
        <div  style={styles.input}>
            <label style={{width: 150}}>ThousandSeparator</label>
            <input style={{flex: 1}} name="thousandSeparator" defaultValue={config.thousandSeparator} />
        </div>
        <div  style={styles.input}>
            <label style={{width: 150}}>DecimalSeparator</label>
            <input style={{flex: 1}} name="decimalSeparator" defaultValue={config.decimalSeparator} />
        </div>
        <div  style={styles.input}>
            <label style={{width: 150}}>Round</label>
            <input style={{flex: 1}} name="round" value="true" defaultChecked={config.round} type="radio" />True
            <input style={{flex: 1}} name="round" value="false" defaultChecked={!config.round} type="radio" />False
        </div>
        <button type="submit" style={{width: 50, alignSelf: 'center'}}>Save</button>
      </form>
      <Test />
        <NumberInput 
        style={{
        height: '50px',
        width: '100%',
        padding: '5px',
        borderRadius: '5px',
        fontSize: '1.5em'
    }}
    value={config.valuenumber}
        onValueChange={onValueChange}
        />
        
        <span>numper format plugin</span>
         <NumberPlugin 
        thousandSeparator={config.thousandSeparator} 
        decimalSeparator={config.decimalSeparator}  
        precision={config.precision}
        value={config.valuenumber}
        roundDecimal={config.round} 
        />
          <span>currency plugin</span>
        <CurrencyInput  
       thousandSeparator={config.thousandSeparator} 
        decimalSeparator={config.decimalSeparator}  
        precision={config.precision}
        value={config.valuenumber}/>
      </div>
      <input />
    </div>
  );
}


const styles = {
  container: {
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    margin: '10px'
  },
  body: {
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%'
  },
  form: {
    display: 'flex', 
    flexDirection: 'column',
    marginBottom: 20
  },
  input: {
    display: 'flex',
    marginBottom: 10
  }
}

export default App;
