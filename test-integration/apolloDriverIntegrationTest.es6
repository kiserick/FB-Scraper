import {Environment} from '../src/env/node'
import {ApolloDriver} from '../src/apolloDriver'
import {Post} from '../src/post.es6'
import {Identity} from '../src/identity.es6'
import {Media} from '../src/media.es6'
import {Comment} from '../src/comment.es6'
import {User} from '../src/user.es6'
import {Email} from '../src/email.es6'

let chai = require('chai')
chai.should()


describe('ApolloDriver', function() {
  
  // Setup Facebook for each test
  let subject = undefined
  beforeEach(function() {
    subject = new ApolloDriver()
    subject.http = new Environment().http
  })
  
  xit('Write out feed', function() {
    
    // Note changing vendor requires change to IOS app as it creates IdentityEntity when vendor is apollo (otherwise database errors)
    let posts = [
       new Post({identity: new Identity({vendor: 'apollo'}), id: '1', message: 'Comment for feedback'
         , creator: new User({vendor: 'devisd', id: 'devisd', name: 'SYSTEM NOTIFICATION', photoUrl: subject.getFileUrl('devisd_avatar.png')})
         , media: [ new Media({description: 'Test Image', type: 'image', imageUrl: subject.getFileUrl('devisd.jpg'), srcUrl: subject.getFileUrl('devisd.jpg') }) ]
       })
    ]

    // Output the feed
    logger.debug('==========================')
    logger.debug('feed.json: ')
    logger.debug(JSON.stringify(posts, null, 2))
    logger.debug('==========================')
  })

  xit('Obtain feed', function(done) {
    this.timeout(20000)
    
    subject.on('loadPostsComplete', function() {
      logger.debug('Loaded ' + subject.items.length + ' posts from Apollo')
      subject.items.forEach(function(post) {
        logger.debug('    POST ' + post.id + ' (vendor ' + post.vendor + ')')
        if (post.identity) {
          logger.debug('      - identity: ' + post.identity.vendor)
        }
        if (post.creator) {
          logger.debug('      - user: ' + post.creator.name)
        }
        post.media.forEach(function(media) {
          logger.debug('      - media: ' + media.srcUrl)
        })
        post.comments.forEach(function(comment) {
          logger.debug('      - comment: ' + comment.message)
        })
      })
      done()
    })
    subject.on('error', function(driver, error) {
      logger.info("FAILED to load posts from Apollo: " + JSON.stringify(error))
      done()
    })
    subject.loadPosts()
  })
  
  
<<<<<<< HEAD
  xit('Email wrapper send email', function (done) {
    this.timeout(10000)
    
    let email = new Email(new Environment().http)
    email.send({
      to: 'dsagenschneider@devisd.com',
      subject: 'Test integration email',
      message: 'Test integration email sent at ' + new Date()
    }, function(data) {
      logger.debug('Email sent')
      done()
    }, function(error) {
      logger.debug('EMAIL ERROR: ' + error)
      chai.assert.fail('Failure in sending email')
    })
  })
  
  
  it('Comment on post (send email)', function(done) {
    this.timeout(10000)

    subject.on('postCommented', (driver, data) => {
      logger.debug('Post commented: ' + JSON.stringify(data))
      done()
    })

    // Send comment (email)
    subject.commentOnPost(
        new Post({id: 'TEST', message: 'Test Post'}),
        'Test Integration Comment'
    )
  })
  
  
  xit('Raw send email', function(done) {
    this.timeout(20000)

    let ses = require('node-ses')
    let client = ses.createClient({ 
      key: 'AKIAJPEF7AA6MKWJ5GJQ', 
      secret: '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', 
      amazon: 'https://email.us-west-2.amazonaws.com'
    })

    client.sendemail({
      to: 'dsagenschneider@devisd.com', 
      from: 'hello@yurn.it', 
      subject: 'Test message', 
      message: 'This is a <b>test</b> message from Social Stream', 
      altText: 'Alternative plain text'
    }, function (err, data, res) {
      logger.debug('ERROR: ' + JSON.stringify(err, null, 2))
      if (err) {
        logger.debug('ERROR MESSAGE: ' + err.message)
      }
      logger.debug('DATA: ' + JSON.stringify(data, null, 2))
      logger.debug('RESPONSE: ' + JSON.stringify(res, null, 2))
      done()
    })
  })
  
  
  it('Send email', function (done) {
    this.timeout(10000)
    
    let email = new Email(new Environment().http)
    email.send({
      to: 'dsagenschneider@devisd.com',
      subject: 'Test integration email',
      message: 'Test integration email sent at ' + new Date()
    }, function(data) {
      logger.debug('Email sent')
      done()
    }, function(error) {
      logger.debug('EMAIL ERROR: ' + error)
      chai.assert.fail('Failure in sending email')
    })
  })
  
})
=======
  xit('Raw send email', function(done) {
    this.timeout(20000)

    let ses = require('node-ses')
    let client = ses.createClient({ 
      key: 'AKIAJPEF7AA6MKWJ5GJQ', 
      secret: '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', 
      amazon: 'https://email.us-west-2.amazonaws.com'
    })

    client.sendemail({
      to: 'dsagenschneider@devisd.com', 
      from: 'hello@yurn.it', 
      subject: 'Test message', 
      message: 'This is a <b>test</b> message from Social Stream', 
      altText: 'Alternative plain text'
    }, function (err, data, res) {
      logger.debug('ERROR: ' + JSON.stringify(err, null, 2))
      if (err) {
        logger.debug('ERROR MESSAGE: ' + err.message)
      }
      logger.debug('DATA: ' + JSON.stringify(data, null, 2))
      logger.debug('RESPONSE: ' + JSON.stringify(res, null, 2))
      done()
    })
  })
  
  
  xit('Email wrapper send email', function (done) {
    this.timeout(10000)
    
    let email = new Email(new Environment().http)
    email.send({
      to: 'dsagenschneider@devisd.com',
      subject: 'Test integration email',
      message: 'Test integration email sent at ' + new Date()
    }, function(data) {
      logger.debug('Email sent')
      done()
    }, function(error) {
      logger.debug('EMAIL ERROR: ' + error)
      chai.assert.fail('Failure in sending email')
    })
  })
  
  
  it('Comment on post (send email)', function(done) {
    this.timeout(10000)

    subject.on('postCommented', (driver, data) => {
      logger.debug('Post commented: ' + JSON.stringify(data))
      done()
    })

    // Send comment (email)
    subject.commentOnPost(
        new Post({id: 'TEST', message: 'Test Post'}),
        'Test Integration Comment'
    )
  })
  
})
>>>>>>> branch 'SocialStreamCommentEmail' of git@github.com:devisd/smagger-core.git
