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
        placeholder: "4111 1111 1111 1111"
      },
      
      cvv: {
        selector: "#cvv",
        placeholder: "123"
      },
      
      expirationDate: {
        selector: "#expiration-date",
        placeholder: "MM/YY"
      }
    }
    
  }).then(cardFields => {
    
    document.querySelector("#card-form").addEventListener("submit", async (event) => {
      
      event.preventDefault();
      document.getElementById('result').innerHTML = "Processing..."
      
      const obj = {}
      if (document.getElementById('3ds').checked) {
        obj.contingencies = ['SCA_ALWAYS']
      }
      
      try {
        const submit_response = await cardFields.submit(obj)
      } catch (err) {
        document.getElementById('result').innerHTML = JSON.stringify(err, null, 2)
      }
      
      const response = await fetch(`${merchant}/api/orders/${orderId}/authorize`, {
        method: "post",
      })
      
      const jsonData = await response.json()
      console.dir(jsonData)
      
      document.getElementById('result').innerHTML = JSON.stringify(jsonData, null, 2)
      
    });
    
  });
  
} else {
  
  document.querySelector("#card-form").style = "display: none";
  
}
