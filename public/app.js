const merchant = location.pathname.replace('/', '')
console.log(`merchant: ${merchant}`)

if (window.paypal.HostedFields.isEligible()) {
  
  let orderId;

  window.paypal.HostedFields.render({
    
    createOrder: async () => {
      
      const response = await fetch(`/${merchant}/api/orders`, {
        method: "post",
        
        headers: {
          "Content-Type": "application/json"
        },
        
        body: JSON.stringify({
          currency: document.getElementById('currency').value,
          amount: document.getElementById('amount').value
        })
      })
      
      const order = await response.json()
      console.dir(order)
      
      orderId = order.id
      
      return order.id
    },
    
    styles: {
      ".valid": {
        color: "green",
      },
      ".invalid": {
        color: "red",
      },
    },
    
    fields: {
      
      number: {
        selector: "#card-number",
        placeholder: "4111 1111 1111 1111",
	prefill: '4813690000512134'
      },
      
      cvv: {
        selector: "#cvv",
        placeholder: "123",
	prefill: '308'
      },
      
      expirationDate: {
        selector: "#expiration-date",
        placeholder: "MM/YY",
	prefill: '0226'
      }
    }
    
  }).then(cardFields => {
    
    document.querySelector("#card-form").addEventListener("submit", async (event) => {
      
      event.preventDefault();
      
      const obj = {}
      if (document.getElementById('3ds').checked) {
	obj.contingencies = ['SCA_ALWAYS']
      }
      
      const submit_response = await cardFields.submit(obj)
      
      const response = await fetch(`${merchant}/api/orders/${orderId}/authorize`, {
        method: "post",
      })
      
      const orderData = response.json()
      
      const errorDetail = Array.isArray(orderData.details) && orderData.details[0];
            
      if (errorDetail) {
        var msg = "Sorry, your transaction could not be processed.";
        
        if (errorDetail.description)
          msg += "\n\n" + errorDetail.description;
        
        if (orderData.debug_id) msg += " (" + orderData.debug_id + ")";
        
        console.log(msg)
      }
      
      console.log('completed.')
      
    });
    
  });
  
} else {
  
  document.querySelector("#card-form").style = "display: none";
  
}
