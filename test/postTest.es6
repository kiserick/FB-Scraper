import {Action} from '../src/data/action.es6'
import {Identity} from '../src/data/identity.es6'
import {Post} from '../src/data/post.es6'

let chai = require('chai')
chai.should()

describe("Post", function() {

	describe("#construct", function() {
    
	  it ("Like States", function() {
	    // Ensure the like states are correct
	    Post.LikeStatusNone.should.equal(0)
	    Post.LikeStatusLike.should.equal(1)
	    Post.LikeStatusDislike.should.equal(2)
	  })
	  
    it("Defaults", function() {
      let post = new Post()
      post.id.should.equal('')
      post.type.should.equal('status')
      post.timestamp.should.equal(0)
      post.rawTimestamp.should.equal('')
      post.message.should.equal('')
      post.link.should.equal('')
      post.actions.should.deep.equal([])
      post.likeStatus.should.equal(Post.LikeStatusNone)
    })
    
    it("All attributes", function() {
      let epochTime = (new Date).getTime()
      let post = new Post({
        identity: new Identity({vendor: 'test'}), 
        id: '1234', 
        type: 'event', 
        timestamp: epochTime,
        rawTimestamp: 'RAW',
        message: 'message', 
        link: 'http://example.com',
        actions: [ new Action({type: 'comment'})],
        likeStatus: Post.LikeStatusLike,
        memento: { id: 1234 }
      })
      post.identity.vendor.should.equal('test')
      post.id.should.equal('1234')
      post.type.should.equal('event')
      post.timestamp.should.equal(epochTime)
      post.rawTimestamp.should.equal('RAW')
      post.message.should.equal('message')
      post.link.should.equal('http://example.com')
      post.actions.should.deep.equal([new Action({type: 'comment'})])
      post.likeStatus.should.equal(Post.LikeStatusLike)
      post.memento.should.deep.equal({id: 1234 })
    })

    it('Error', function() {
      let error = new Error('TEST')
      error.message.should.equal('TEST')
    })
	})

})

