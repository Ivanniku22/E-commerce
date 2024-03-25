import {useSelector} from 'react-redux'
import { Box, Button , Stepper , Step , StepLabel} from '@mui/material'
import { Formik } from 'formik'
import { useState } from 'react'
import * as yup from 'yup'
import Shipping from "./Shipping"
import Payment from './Payment'
import { shades } from '../../theme'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(
  "pk_test_51Oy8zySIWgS1mDTkBeuXpcbWieVOfdh6zbhp8xrWwoPzv5HUaJZceknTamd7KTOnzJlULgplGhLbNinxEX1G3l0B00taoypJP8"
)

const initialValues = {
  billingAddress: {
    firstName: "",
    lastName: '',
    country:'',
    street1:'',
    street2:'',
    city:'',
    state:'',
    zipCode:'',
  },
  
  shippingAddress: {
    isSameAddress:true,
    firstName: "",
    lastName: '',
    country:'',
    street1:'',
    street2:'',
    city:'',
    state:'',
    zipCode:'',
  },

  email:'',
  phoneNumber:'',

}


const checkoutSchema = [
  yup.object().shape({
    billingAddress : yup.object().shape({
      firstName: yup.string().required("First Name Required"),
      lastName: yup.string().required("Last Name Required"),
      country:yup.string().required("Country Required"),
      street1:yup.string().required("Street Required"),
      street2:yup.string(),
      city:yup.string().required("City Required"),
      state:yup.string().required("State Required"),
      zipCode:yup.string().required("ZipCode Required"),
    }),
    shippingAddress : yup.object().shape({
      isSameAddress:yup.boolean(),
      firstName: yup.string().when("isSameAddress",{
        is:false,
        then:() => yup.string().required("First Name Required")
      }),
      lastName: yup.string().when("isSameAddress",{
        is:false,
        then:() => yup.string().required("Last Name Required")
      }),
      country:yup.string().when("isSameAddress",{
        is:false,
        then:() => yup.string().required("Country  Required")
      }),
      street1:yup.string().when("isSameAddress",{
        is:false,
        then:() => yup.string().required("Street Required")
      }),
      street2:yup.string(),
      city:yup.string().when("isSameAddress",{
        is:false,
        then:() => yup.string().required("City Required")
      }),
      state:yup.string().when("isSameAddress",{
        is:false,
        then:() => yup.string().required("State Required")
      }),
      zipCode:yup.string().when("isSameAddress",{
        is:false,
        then:() => yup.string().required("ZipCode Required")
      }),
    }),
  }),

  yup.object().shape({
    email: yup.string().required("Email Required"),
    phoneNumber: yup.string().required("Phone Number Required")
  })
]

const Checkout = () => {

  const [activeStep , setActiveStep] = useState(0)
  const cart = useSelector((state) => state.cart.cart)
  const isFirstStep = activeStep === 0
  const isSecondStep = activeStep === 1


  const handleFormSubmit = async(values,actions) => {
    setActiveStep(activeStep+1)

    //Copies Billing Address to Shipping Address
    if(isFirstStep && values.shippingAddress.isSameAddress){
      actions.setFieldValue('shippingAddress', {
        ...values.billingAddress,
        isSameAddress:true,
      })
    }

    if(isSecondStep){
      makePayment(values)
    }

    actions.setTouched({})
  }


  async function makePayment(values){
    const stripe = await stripePromise
    const requestBody = {
      userName: [values.firstName , values.lastName].join(""),
      email:values.email,
      products:cart.map(({id,count}) => ({
        id,
        count,
      }))
    }
    
    

    const response = await fetch("http://localhost:1337/api/orders",{
      method:"POST",
      headers:{"Content-Type": "application/json"},
      body: JSON.stringify(requestBody)
    })

    const session = await response.json()

    await stripe.redirectToCheckout({
      sessionId: session.id,
    })
  }

  
  return (
    <Box width={'80%'} m={'100px auto'}>
      <Stepper activeStep={activeStep} sx={{m:'20px 0'}}>
        <Step>
          <StepLabel>Billing</StepLabel>
        </Step>
        <Step>
          <StepLabel>Payments</StepLabel>
        </Step>
      </Stepper>

      <Box>
        <Formik
          onSubmit={handleFormSubmit}
          initialValues={initialValues}
          validationSchema={checkoutSchema[activeStep]}
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleChange,
            handleSubmit,
            setFieldValue,
          }) => (
            <form onSubmit={handleSubmit}>
              {isFirstStep && (
                <Shipping 
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleBlur={handleBlur}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                />
              )}
              {isSecondStep && (
                <Payment
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleBlur={handleBlur}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                />
              )}
              <Box display={'flex'} justifyContent={'space-between'} gap={'50px'}>
                {isSecondStep && (
                  <Button
                    fullWidth
                    color='primary'
                    variant='contained'
                    sx={{
                      backgroundColor:shades.primary[200],
                      boxShadow:'none',
                      color:'white',
                      borderRadius:0,
                      padding:'15px 40px'
                    }}
                    onClick={() => setActiveStep(activeStep-1)}
                  >
                    Back
                  </Button>
                )}
                <Button
                    fullWidth
                    type='submit'
                    color='primary'
                    variant='contained'
                    sx={{
                      backgroundColor:shades.primary[400],
                      boxShadow:'none',
                      color:'white',
                      borderRadius:0,
                      padding:'15px 40px'
                    }}
                  >
                    {isFirstStep ? "Next" : "Place Order"}
                  </Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    </Box>
  )
}

export default Checkout