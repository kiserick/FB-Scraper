import {Environment} from '../src/env/node'
import {FacebookDriver} from '../src/facebookDriver'
import {HtmlHandlerFactory} from '../src/HtmlHandlerFactory'
import {Post} from '../src/data/post'
import {Identity} from '../src/data/identity'
import {Media} from '../src/data/media'
import {FormDataSender} from '../src/formData'
import {UserRegistry} from '../src/facebook/UserRegistry'

let chai = require('chai')
chai.should()

let fs = require('fs')
let moment = require('moment')

describe("FacebookDriver", function() {

  // Test Integration User (test user details for Apollo)
  let cookies = "datr=sfJ1V6T5VoxmT4vAiMyBSHfx; locale=en_US; noscript=1; sb=u_J1V-U9CNaz-c7Lfvs7t0rI; c_user=100009543463363; xs=2%3AdJ_Jqq-q9ZhY8A%3A2%3A1470293021%3A18980; fr=0WYjZRDZ134zoaouv.AWX3rpONP9TnOqnAlojkdOi53gg.BXdfKx.Ze.AAA.1.0.BXouQd.AWW8GKc4; csm=2; s=Aa7ZXNP0KX0APmU8.BXouQd; m_user=0%3A0%3A0%3A0%3Av_1%2Cajax_0%2Cwidth_0%2Cpxr_0%2Cgps_0%3A1470293021%3A2; lu=RiVVAW6TViRULOB6wP_488iA"
  let testUserId = (cookies.match(/c_user=([0-9]+)/)[1])

  // Setup Facebook for each test
  let subject = undefined
  beforeEach(function() {
    chai.assert.isDefined(testUserId)
    subject = new FacebookDriver(new Identity({vendor: 'facebook', oauthSecret: cookies, userId: testUserId}), null, new HtmlHandlerFactory(), new UserRegistry())
    subject.http = new Environment().http
  })
  
  describe('#sendPost', function() {
    
      xit('text only', function(done) {
          this.timeout(20000)
          
          let post = new Post({message: 'test post ' + moment().format('MMM Do YYYY, h:mm:ss a')})
          subject.on('postSent', function(driver, data) {
              logger.debug('Created post ' + JSON.stringify(data, null, 2))
              done()
          })
          subject.on('error', function(error) {
              logger.debug('ERROR: failed sending post ' + JSON.stringify(error))
          })
          subject.sendPost(post)
      })
      
      xit('with an image', function(done) {
          this.timeout(200000)
          let imageFilePath = __dirname + '/TestImage.jpg'
          fs.readFile(imageFilePath, (err, data) => {
              if (err) return done(err)
              let imageBase64 = data.toString('base64')
              
              // Ensure image is generated correctly
              fs.writeFileSync(__dirname + '/../requests/image.jpg', new Buffer(imageBase64, 'base64'))
              
              let post = new Post({
                  message: 'test post ' + moment().format('MMM Do YYYY, h:mm:ss a'),
                  media: [new Media({type: 'photo', mimeType: 'image/jpeg', srcUrl: 'http://test.com/image.png'})]
                  })
              subject.on('postSent', function(driver, data) {
                  logger.debug('Created post ' + JSON.stringify(data, null, 2))
                  done()
              })
              subject.on('error', function(error) {
                  logger.debug('ERROR: failed sending post ' + JSON.stringify(error))
              })
              subject.sendPost(post, (media, type, handler) => {
                  handler({ imageBase64Data: imageBase64 })
              })
          });
      })

      it('with two images', function(done) {
          this.timeout(200000)
          let imageFilePath = __dirname + '/TestImage.jpg'
          fs.readFile(imageFilePath, (err, data) => {
              if (err) return done(err)
              let imageOneBase64 = data.toString('base64')
              
              fs.readFile(__dirname + '/TestImage3.png', (err, data) => {
                  if (err) return done(err)
                  let imageTwoBase64 = data.toString('base64')

                  let post = new Post({
                      message: 'test post ' + moment().format('MMM Do YYYY, h:mm:ss a'),
                      media: [
                          new Media({type: 'photo', mimeType: 'image/jpeg', srcUrl: 'ONE'}),
                          new Media({type: 'photo', mimeType: 'image/png', srcUrl: 'TWO'})
                          ]
                      })
                  subject.on('postSent', function(driver, data) {
                      logger.debug('Created post ' + JSON.stringify(data, null, 2))
                      done()
                  })
                  subject.on('error', function(error) {
                      logger.debug('ERROR: failed sending post ' + JSON.stringify(error))
                  })
                  subject.sendPost(post, (media, type, handler) => {
                      switch (media.srcUrl) {
                          case 'ONE':
                              handler({ imageBase64Data: imageOneBase64 })
                              break;
                          case 'TWO':
                              handler({ imageBase64Data: imageTwoBase64 })
                              break;
                          default:
                              done(new Error('Unknown image ' + media.srcUrl))
                      }
                  })
              })
          });
      })

  })
  
})