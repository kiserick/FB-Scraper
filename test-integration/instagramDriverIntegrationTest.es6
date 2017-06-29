import {Environment} from '../src/env/node'
import {InstagramDriver} from '../src/instagramDriver'
import {Post} from '../src/post'
import {Identity} from '../src/identity'

let chai = require('chai')
chai.should()

describe("InstagramDriver", function() {

  // Details for testing
  let accessToken = '1823927202.5368d86.8179a953152649129071b460e42044d8'
  let testPostId = '988568468835592855_1011593'

  // Setup Facebook for each test
  let subject = undefined
  beforeEach(function() {
    subject = new InstagramDriver(new Identity({vendor: 'instagram', oauthToken: accessToken}))
    subject.http = new Environment().http
  })

  
  describe("#load", function() {

    it("Load Data", function(done) {
      this.timeout(10000)

      subject.on('loadPostsComplete', function() {
        logger.debug('Loaded ' + subject.items.length + ' posts from Instagram')
        subject.items.forEach(function(post) {
          logger.debug('    INSTAGRAM ' + post.id + ' timestamp: ' + post.timestamp + ' message: ' + post.message)
          if (post.creator) {
            logger.debug('      - user: ' + post.creator.name)
          }
          post.media.forEach(function(media) {
            logger.debug('      - media: ' + media.srcUrl)
          })
        })
        done()
      })
      subject.on('error', function(driver, error) {
        logger.info("FAILED to load posts from Instagram: " + JSON.stringify(error))
        done()
      })
      subject.loadPosts()
    })
    
    it("Load pagination data", function(done) {
      this.timeout(10000)
      
      subject.on('error', function(driver, error) {
        logger.info('FAILED to load pagination posts from Instagram: ' + JSON.stringify(error))
        done()
      })
      
      let isPaged = false
      subject.on('loadPostsComplete', function() {
        if (!isPaged) {

          logger.debug('Loaded ' + subject.items.length + ' posts from Instagram')
          subject.items.forEach(function(post) {
            logger.debug('    Loaded INSTAGRAM ' + post.id + ' timestamp: ' + post.timestamp + ' message: ' + post.message)
            if (post.creator) {
              logger.debug('      - user: ' + post.creator.name)
            }
            post.media.forEach(function(media) {
              logger.debug('      - media: ' + media.srcUrl)
            })
          })

          // Load further pagination data
          isPaged = true
          subject.loadNextPageOfPosts()
          return
        }
        
        // Loaded pagination data
        logger.debug('Loaded next page of ' + subject.items.length + ' posts from Instagram')
        subject.items.forEach(function(post) {
          logger.debug('    Paged INSTAGRAM ' + post.id + ' timestamp: ' + post.timestamp + ' message: ' + post.message)
          if (post.creator) {
            logger.debug('      - user: ' + post.creator.name)
          }
          post.media.forEach(function(media) {
            logger.debug('      - media: ' + media.srcUrl)
          })
        })
        done()
      })
      subject.loadPosts()
    })

  })
  

  describe('#like/unlike', function() {
    
    xit('like post', function(done) {
      subject.on('postLiked', function(driver, result) {
        // Ensure appropriate results for liking the post
        result.postId.should.equal(testPostId)
        result.data.success.should.equal(true)
        done()
      })
      subject.on('error', function(driver, error) {
        // In case of error (able to report it)
        error.message.should.equal('Should not have an error')
        done()
      })
      subject.likePost(testPostId)
    })
    
    xit('unlike post', function(done) {
      subject.on('postUnliked', function(driver, result) {
        // Ensure appropriate results for unliking the post
        result.postId.should.equal(testPostId)
        result.data.success.should.equal(true)
        done()
      })
      subject.on('error', function(driver, error) {
        // In case of error (able to report it)
        error.message.should.equal('Should not have an error')
        done()
      })
      subject.unlikePost(testPostId)
    })
  })
  
  
  describe('#comment', function() {
    
    xit('on post', function(done) {
      subject.on('postCommented', function(driver, result) {
        // Ensure appropriate results for liking the post
        result.postId.should.equal(testPostId)
        result.data.success.should.equal(true)
        done()
      })
      subject.on('error', function(driver, error) {
        // In case of error (able to report it)
        error.message.should.equal('Should not have an error')
        done()
      })
      subject.commentOnPost(new Post({id: testPostId}), 'Comment for integration test')
    })
    
  })

})