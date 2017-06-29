import {Environment} from '../src/env/node'
import {TwitterDriver} from '../src/twitterDriver'
import {Post} from '../src/post'
import {Identity} from '../src/identity'
import {Media} from '../src/media'
import {User} from '../src/user'
import {OAuthHttp} from '../src/oauthHttp'
import {FormData} from '../src/formData'

let fs = require('fs')

let chai = require('chai')
chai.should()

describe("Twitter", function() {

  var oauthToken = '3167024852-hgBfOQDD4AYd4SXIIFuVHXdqvQroxEfZcCuPDPc'
  var oauthTokenSecret = 'OOf46UCJjnUWTgEEfH3KERwgUKlhsOCigvzL72ZBjPF1y'

  // Setup Twitter for each test
  let subject = undefined
  beforeEach(function() {
    subject = new TwitterDriver(new Identity({vendor: 'twitter', oauthToken: oauthToken, oauthSecret: oauthTokenSecret}))
    subject.http = new Environment().http
  })

  describe("TwitterDriver", function() {
    
    xit('#send text tweet', function(done) {
      this.timeout(10000)
      
      let post = new Post({message: 'Test tweet ' + new Date().toString()})
      
      // Provide means to obtain the media
      let getMediaData = (media, mimeType, callback) => {
        throw new Error('Should not be called')
      }
      
      // Send post to twitter
      subject.on('postSent', function(data) {
        logger.debug('SUCESS: ' + JSON.stringify(data))
        done()
      })
      subject.on('error', function(error) {
        logger.info('FAILURE: ' + JSON.stringify(error))
      })
      subject.sendPost(post, getMediaData)
    })
  
    
      // Provide callback to obtain the image
      let getMediaData = (media, mimeType, callback) => {
        // Obtain the data
        let stream = fs.createReadStream('./test-integration/' + media.imageUrl)
        let buffer = []
        stream.on('data', (data) => {
          buffer.push(data)
        })
        stream.on('end', (data) => {
          if (data) {
            buffer.push(data)
          }
          let imageData = Buffer.concat(buffer)
          let base64Data = imageData.toString('base64')
          callback({ imageBase64Data: base64Data})
        })
      }

      xit('#send tweet with video', function(done) {
        this.timeout(20000)
        
        // Create the post with a video
        let media = [
          new Media({type: 'video', imageUrl: 'TestVideo2.mp4'})
        ]
        let post = new Post({message: 'Test tweet with video image ' + new Date().toString(), media: media})
        
        // Send post to twitter
        subject.on('postSent', function(data) {
          logger.debug('SUCESS: ' + JSON.stringify(data))
          done()
        })
        subject.on('error', function(error) {
          logger.info('Video FAILURE: ' + JSON.stringify(error))
        })
        subject.sendPost(post, getMediaData)
      })

    xit('#send tweet with single image', function(done) {
      this.timeout(20000)
      
      // Create the post with a single image
      let media = [
        new Media({imageUrl: 'TestImage.jpg', srcUrl: 'TestImage.jpg'})
      ]
      let post = new Post({message: 'Test tweet with single image ' + new Date().toString(), media: media})
      
      // Send post to twitter
      subject.on('postSent', function(data) {
        logger.debug('SUCESS: ' + JSON.stringify(data))
        done()
      })
      subject.on('error', function(error) {
        logger.info('FAILURE: ' + JSON.stringify(error))
      })
      subject.sendPost(post, getMediaData)
    })
    
    
    xit ("#send tweet with multiple images", function(done) {
      this.timeout(60000)
      
      // Create the post with multiple images
      let media = [
        new Media({imageUrl: 'TestImage.jpg'}),
        new Media({imageUrl: 'TestImageTwo.jpg'})
      ]
      let post = new Post({message: 'Test tweet with multiple images ' + new Date().toString(), media: media})
      
      // Send post to twitter
      subject.on('postSent', function(data) {
        logger.debug('SUCESS: ' + JSON.stringify(data))
        done()
      })
      subject.on('error', function(error) {
        logger.info('FAILURE: ' + JSON.stringify(error))
      })
      subject.sendPost(post, getMediaData)
    })
    
    
    xit("#load", function(done) {
      this.timeout(10000)
      subject.on('loadPostsComplete', function() {
        logger.debug('LoadComplete with ' + subject.items.length + ' posts')
        subject.items.forEach(function(post) {
          logger.debug('    TWEET ' + post.id)
          post.media.forEach(function(media) {
            logger.debug('      - media: ' + media.srcUrl)
          })
          post.comments.forEach(function(comment) {
            logger.debug('      - comment: ' + comment.id + ' ' + comment.message)
          })
        })
        done()
      })
      subject.on('error', function(driver, error) {
        logger.info('Failed to load Twitter data: ' + JSON.stringify(error))
        done()
      })
      subject.loadPosts()
    });

    
    xit("Load pagination data", function(done) {
      this.timeout(10000)
      subject.on('error', function(driver, error) {
        logger.info('FAILED to load pagination posts from Twitter: ' + JSON.stringify(error))
        done()
      });
      
      let isPaged = false
      subject.on('loadPostsComplete', function() {
        if (!isPaged) {
          
          logger.debug('Loaded ' + subject.items.length + ' tweets from Twitter')
          subject.items.forEach(function(post) {
            logger.debug('   Loaded TWEET ' + post.id)
            post.media.forEach(function(media) {
              logger.debug('      - media: ' + media.srcUrl)
            })
            post.comments.forEach(function(comment) {
              logger.debug('      - comment: ' + comment.id + ' ' + comment.message)
            })
          })

          // Load further pagination data
          isPaged = true
          subject.loadNextPageOfPosts()
          return
        }
        
        // Loaded pagination data
        logger.debug('Loaded ' + subject.items.length + ' tweets from Twitter')
        subject.items.forEach(function(post) {
          logger.debug('   Paged TWEET ' + post.id)
          post.media.forEach(function(media) {
            logger.debug('      - media: ' + media.srcUrl)
          })
          post.comments.forEach(function(comment) {
            logger.debug('      - comment: ' + comment.id + ' ' + comment.message)
          })
        })
        done()
      })
      subject.loadPosts()
    });

    
    xit('Favour Tweet by identifier... ', function(done) {
        this.timeout(10000);
        var tweetId = '601221591704403968';
        subject.on('error', (error) => {
            logger.info('FAILED to favour Tweet. Response ' + JSON.stringify(error))
            chai.assert.fail('Received error from Twitter')
            done();
        })
        subject.on('postLiked', (response) => {
            done()
        })
        subject.likePost(tweetId);
    });

    
    xit('Unfavoured Tweet by identifier... ', function(done) {
        this.timeout(10000)
        var tweetId = '601221591704403968';
        subject.on('error', (error) => {
            logger.info('FAILED to unfavour Tweet. Response ' + JSON.stringify(error))
            chai.assert.fail('Received error from Twitter')
            done()
        })
        subject.on('postUnliked', (response) => {
            done()
        })
        subject.unlikePost(tweetId);
    })
    
    
    xit('Comment on tweet', function(done) {
      this.timeout(10000)
      var tweetId = '608149060885737472'
      subject.on('error', (error) => {
          logger.info('FAILED to comment on Tweet. Response ' + JSON.stringify(error));
          chai.assert.fail('Received error from Twitter');
          done();
      });
      subject.on('postCommented', (driver, response) => {
        logger.debug('Successfully commented on tweet: ' + JSON.stringify(response))
        done()
      })
      subject.commentOnPost(new Post({id: tweetId, creator: new User({id: 'testdevisd'})}), 'Test comment from Twitter integration test')
    })
    
    
    xit('Notifications', function(done) {
      this.timeout(60000)
      subject.on('error', (error) => {
        logger.info('FAILED to obtain notifications: ' + JSON.stringify(error))
        chai.assert.fail('Received error from Twitter: ' + JSON.stringify(error))
        done()
      })
      subject.on('loadNotificationsComplete', (driver, response) => {
        subject.notifications.forEach(function(notification) {
          logger.debug('    NOTIFICATION ' + notification.id)
          logger.debug('      - message: ' + notification.message)
          if (notification.creator) {
            logger.debug('      - creator: ' + notification.creator.name + ' (' + notification.creator.photoUrl + ')')
          }
        })
        done()
      })
      subject.loadNotifications()
    })

  })
  
})