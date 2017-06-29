// Active HTTP
var activeHttp
var activeHandlers

// Ensure the request is overridden
exports.request = function(options) {
  
  // Specify email details
  options.host = 'email.us-west-2.amazonaws.com'
  options.path = ''
  
  // Undertake the request
  activeHttp.request(options, activeHandlers.success, activeHandlers.error)
}

// Necessary export to have work (Note: not use as is part of processing response)
exports.xml2js = {
  Parser: function() {}
}

var ses = require('node-ses')

export class Email {
  
  constructor(http) {
    
    // Set the active HTTP
    activeHttp = http
    
    // Create the client
    this.client = ses.createClient({ 
      key: 'AKIAJPEF7AA6MKWJ5GJQ', 
      secret: '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', 
      amazon: 'https://email.us-west-2.amazonaws.com'
    })
  }
  
  /**
   * options: { [to], [from], subject, message }
   */
  send(options, success, error) {
    
    // Specify the active handlers
    activeHandlers = {
        success: success,
        error: error
    }
    
    // Ensure have to address
    if (!options.to) {
      options.to = 'other@devisd.com'
    }
    
    // Ensure have from address
    if (!options.from) {
      options.from = 'other@devisd.com'
    }
    
    // Send the email (using the active HTTP)
    this.client.sendemail(options)
  }
}
