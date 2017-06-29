import {FormDataSender} from '../src/formData'

let chai = require('chai')
chai.should()

let fs = require('fs')

describe("FormData", function() {

  it('Test POST image to Facebook', function(done) {
    
    // Mock HTTP request (ensure IOS request is used)
    let http = {
      request: function(options, success, failure) {
        options.method.should.equal('POST')
        options.protocol.should.equal('https:')
        options.host.should.equal('graph.facebook.com')
        options.path.should.equal('/v2.3/me/photos/?access_token=ACCESS_TOKEN')
        options.body.should.not.to.be.null
        success({result: 'SUCCESSFUL'})
      }
    }
    
    // Send the form data
    let subject = new FormDataSender(http)
    subject.append('source', fs.createReadStream('./test-integration/TestImage.jpg'))
    let options = {
      method: 'POST',
      protocol: 'https:',
      host: 'graph.facebook.com',
      path: '/v2.3/me/photos/?access_token=ACCESS_TOKEN'
    }
    subject.submit(options, (data) => {
      // Ensure successful
      data.result.should.equal('SUCCESSFUL')
      done()
    }, (error) => {
      // Should not occur
      'error'.should.equal('not occur')
    })
  })
  
})