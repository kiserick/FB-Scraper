import {Environment} from '../src/env/node'
import {Smagger} from '../src/smagger'
import {Identity} from '../src/identity'
import {FacebookDriver} from '../src/facebookDriver'
import {TwitterDriver} from '../src/twitterDriver'
import {InstagramDriver} from '../src/instagramDriver'

let chai = require('chai')
chai.should()

describe("Smagger", function() {
  
    let facebookAccessToken = 'CAACEdEose0cBADx7LFoZCxjaAOspePdyPt1Bvei7oLbgTZALnUTAYzN9phI9Q0fhNh7H87Uvp44MsLZAxvxZAhdAcozX5RlSDH8woZAHOfmOGAjU5P4UsOWd12pfuqrZBEbOtjsXGMY4Nd9sAG2tpMqSE9JCYwIHnjIs0LVAZC33ZC4aT2twvB65rZCGyvfY2Tklw6BvfmMHSXfXta4HY7SZCWNeqoBZBZCUbXxuyhNFYD4dRwZDZD'
    let twitterOAuthToken = '2457457339-ItU2EEOYVRIb2NNdI1Fr8krZrySDU3A3A1TEz5s'
    let twitterOAuthTokenSecret = '6rRAvsi5VwsGmkSKupaN9pVpxddfUsI7FsiZrhryDbnSs'
    let instagramAccessToken = '1776291957.5368d86.58cb1a8b857544b0a39164a256b7f8be'

      
    it("#load posts", function(done) {
      this.timeout(10000)

      let subject = new Smagger()
      subject.env = new Environment()
      subject.driverRegistry.facebook = FacebookDriver
      subject.driverRegistry.twitter = TwitterDriver
      subject.driverRegistry.instagram = InstagramDriver
      subject.addDriver(new Identity({vendor: 'facebook', oauthToken: facebookAccessToken}))
      subject.addDriver(new Identity({vendor: 'twitter', oauthToken: twitterOAuthToken, oauthSecret: twitterOAuthTokenSecret }))
      subject.addDriver(new Identity({vendor: 'instagram', oauthToken: instagramAccessToken}))

      subject.on('loadPostsComplete', function() {
        logger.debug('Loaded ' + subject.items.length + ' posts with Smagger (errors ' + subject.errors.length + ')')
        subject.items.forEach(function(post) {
          logger.debug('    ' + post.identity.vendor + ' ' + post.id + ' (timestamp ' + post.rawTimestamp + ', photo: ' + post.photoUrl + ')')
        })
        done()
      })
      subject.on('error', function(driver, error) {
        logger.info("FAILED to load posts: " + JSON.stringify(error))
        done()
      })
      subject.loadPosts()
    })

    it("#load paged posts", function(done) {
      this.timeout(10000)

      let subject = new Smagger()
      subject.env = new Environment()
      subject.driverRegistry.facebook = FacebookDriver
      subject.driverRegistry.twitter = TwitterDriver
      subject.driverRegistry.instagram = InstagramDriver
      subject.addDriver('facebook', facebookAccessToken)
      subject.addDriver('twitter', {oauthToken: twitterOAuthToken, oauthTokenSecret: twitterOAuthTokenSecret })
      subject.addDriver('instagram', instagramAccessToken)
      
      let isPaged = false
      subject.on('loadPostsComplete', function() {
        if (!isPaged) {
          isPaged = true
          subject.loadNextPageOfPosts()
          return
        }

        logger.debug('Loaded ' + subject.items.length + ' posts with Smagger (errors ' + subject.errors.length + ')')
        subject.items.forEach(function(post) {
          logger.debug('    ' + post.identity.vendor + ' ' + post.id + ' (photo: ' + post.photoUrl + ')')
        })

        done()
      })
      subject.on('error', function(driver, error) {
        logger.info("FAILED to load posts: " + JSON.stringify(error))
        done()
      })
      subject.loadPosts()
    })
    
    it('#load notifications', function(done) {
      this.timeout(10000)
      
      let subject = new Smagger()
      subject.env = new Environment()
      subject.driverRegistry.facebook = FacebookDriver
      subject.driverRegistry.twitter = TwitterDriver
      subject.driverRegistry.instagram = InstagramDriver
      subject.addDriver('facebook', facebookAccessToken)
      subject.addDriver('twitter', {oauthToken: twitterOAuthToken, oauthTokenSecret: twitterOAuthTokenSecret })
      subject.addDriver('instagram', instagramAccessToken)

      subject.on('loadNotificationsComplete', function() {
        logger.debug('Loaded ' + subject.notifications.length + ' notifications with Smagger (errors ' + subject.errors.length + ')')
        subject.notifications.forEach(function(notification) {
          logger.debug('    ' + notification.vendor + ' ' + notification.id + ' (timestamp ' + notification.rawTimestamp + ')')
        })
        done()
      })
      subject.on('error', function(driver, error) {
        logger.info("FAILED to load posts: " + JSON.stringify(error))
        done()
      })
      subject.loadNotifications()
    })

    it("#load paged notifications", function(done) {
      this.timeout(10000)

      let subject = new Smagger()
      subject.env = new Environment()
      subject.driverRegistry.facebook = FacebookDriver
      subject.driverRegistry.twitter = TwitterDriver
      subject.driverRegistry.instagram = InstagramDriver
      subject.addDriver('facebook', facebookAccessToken)
      subject.addDriver('twitter', {oauthToken: twitterOAuthToken, oauthTokenSecret: twitterOAuthTokenSecret })
      subject.addDriver('instagram', instagramAccessToken)

      subject.on('loadNotificationsComplete', function() {

        logger.debug('Loaded ' + subject.notifications.length + ' notifications with Smagger (errors ' + subject.errors.length + ')')
        subject.notifications.forEach(function(notification) {
          logger.debug('    ' + notification.vendor + ' ' + notification.id + ' (photo: ' + notification.photoUrl + ')')
        })

        done()
      })
      subject.on('error', function(driver, error) {
        logger.info("FAILED to load notifications: " + JSON.stringify(error))
        done()
      })
      subject.loadNotifications()
    })

})