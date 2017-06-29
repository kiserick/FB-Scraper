import {HtmlHandlerFactory} from '../src/HtmlHandlerFactory.es6';

require('../src/env/overrides.js');

let chai = require('chai');
let subject = {};
chai.should();

/******************* HELPER FUNCTIONS HERE *********************/
let executeTest = (host, path, data, expected) => subject.create(host, path, data, () => {}).constructor.name.should.equal(expected);
let testAlbum = (host, path, data) => executeTest(host, path, data, 'FacebookAlbumHandler');
let testDelete = (host, path, data) => executeTest(host, path, data, 'FacebookDeleteHandler');
let testFeed = (host, path, data) => executeTest(host, path, data, 'FacebookFeedHandler');
let testGroupNotifications = (host, path, data) => executeTest(host, path, data, 'FacebookNotificationGroupPostHandler');
let testNotifications = (host, path, data) => executeTest(host, path, data, 'FacebookNotificationsHandler');
let testPhoto = (host, path, data) => executeTest(host, path, data, 'FacebookPhotoHandler');
let testPhotoUpload = (host, path, data) => executeTest(host, path, data, 'FacebookAddPhotoHandler');
let testPost = (host, path, data) => executeTest(host, path, data, 'FacebookPostHandler');
let testProfile = (host, path, data) => executeTest(host, path, data, 'FacebookProfileHandler');

/************************* TESTS ********************************/
describe('HtmlHandlerFactory:', function() {

	beforeEach(() => subject = new HtmlHandlerFactory());

	describe('FacebookAddPhotoHandler tests:', () => {

		it('Facebook upload photo page...', () => {
			testPhotoUpload('https://mbasic.facebook.com', '/composer/mbasic/?mnt_query&prompt_id&prompt_tracking_string&csid=91abfadc-7838-44aa-8a25-e149e9ca09f7&ctype=inline&errcode=0&cwevent=composer_entry&tag_friends_query&filter_type=0&av=100009543463363&rst_icv&icv&bg_sync_id&ogi_offset=0&ogi_limit=0&lat&lon&pos&x-acc=0&view_photo&_rdr', '<html></html>');
		});

	});

	describe('FacebookFeedHandler tests:', function() {

		it('Facebook mobile site should create a FacebookHandler...', () => {
			testFeed('https://m.facebook.com', '/', '<html><head><title>Facebook</title></head></html>');
		});

		it('Facebook mobile site (sans protocol) should create a FacebookHandler...', () => {
			testFeed('m.facebook.com', '/', '<html><head><title>Facebook</title></head></html>');
		});

		it('Facebook mobile site (sans path) should create a FacebookHandler...', () => {
			testFeed('m.facebook.com', '', '<html><head><title>Facebook</title></head></html>');
		});

		it('Facebook mobile site (alternative host) should create a FacebookHandler...', () => {
			testFeed('mbasic.facebook.com', '', '<html><head><title>Facebook</title></head></html>');
		});

		it('Facebook mobile site (alternative url) should create a FacebookHandler...', () => {
			testFeed('m.facebook.com', '/home.php', '<html><head><title>Facebook</title></head></html>');
		});

		it('Facebook mobile site (alternative title) should create a FacebookHandler...', () => {
			testFeed('m.facebook.com', '/stories.php?aftercursorr=1455154869%3A1455154869%3A3%3A-2706902405061773202%3A1455102938%3A0%3A0%3A120&tab=h_nor&__m_log_async__=1&refid=7', '<html><head><title>News Feed</title></head></html>');
		});
	});

	describe('FacebookDeleteHandler tests:', () => {

		it('Facebook delete post confirmation page should create a FacebookDeleteHandler...', () => {
			testDelete('mbasic.facebook.com', '/delete.php?perm&story_permalink_token=S%3A_I100009834785112%3A273501259654365&continue=%2Fstories.php%23s_cbcd49e0daa660cea5de3b339c242cae&refid=52&_ft_=top_level_post_id.273501259654365%3Atl_objid.273501259654365%3Athid.100009834785112', '<html><head><title>Delete Post</title></head></html>');
		});
		
	});

	describe('FacebookPostHandler tests:', function() {

		it('Facebook comments page should create a FacebookPostHandler...', () => {
			testPost('mbasic.facebook.com', 'story.php?story_fbid=10156553804195055&id=599035054&bacr=1454977389%3A1454977389%3A2%3A257823440357012311%3A1454904462%3A0%3A0%3A120&refid=28&_ft_=qid.6249090976209629353%3Amf_story_key.1997425894456081088#footer_action_list', '<html><head><title>Comments</title></head></html>');
		});

		it('Facebook post to a group should create a FacebookPostHandler...', () => {
			testPost('mbasic.facebook.com', '/groups/1667167856835981?view=permalink&id=1750693488483417&bacr=1454983859%3A1454983859%3A1%3A-3032136068105979737%3A1454980169%3A0%3A0%3A39&refid=7&_ft_=qid.6249108100110727269%3Amf_story_key.471088877557259645#footer_action_list', '<html><head><title>Perth Beer Economy</title></head></html>');
		});

		it('Facebook group post should create a FacebookPostHandler...', () => {
			testPost('m.facebook.com', 'groups/1667167856835981?view=permalink&id=1751163445103088&refid=8#footer_action_list', '<html><head><title>Perth Beer Economy</title></head></html>');
		});

		it('Facebook add comment should create a FacebookPostHandler (as resulting page is the post)', () => {
			testPost('https://m.facebook.com', '/a/comment.php', '<html><head><title>Perth Beer Economy</title></head></html>');
		});

		it('Redirection to reshared post should create a FacebookPostHandler', () => {
			testPost('https://m.facebook.com', '/story.php?story_fbid=273458442991980&id=100009834785112&_rdr', '<html><head><title>Comments</title></head></html>');
		});

		it('Facebook x and x are now friends shoulde create a FacebookPostHandler', () => {
			testPost('https://m.facebook.com', '/story.php?story_fbid=1200171653334601&substory_index=0&id=100000253323627&bacr=1466991085%3A1466991085%3A5%3A-1658746534661324436%3A1466801274%3A0&refid=8&_ft_=qid.6300704130997680453%3Amf_story_key.-3524822097544421629#footer_action_list', '<html><head><title>Comments</title></head></html>');
		});
	});

	describe('FacebookAlbumHandler:', function() {

		it('Facebook album', function() {
			testAlbum('mbasic.facebook.com', '/Genesis67/albums/10153444997998716/?bacr=1455500538%3A1455500538%3A4%3A6184530279428542009%3A1455500372%3A0%3A0%3A240&refid=7&_ft_=qid.6251327765056411284%3Amf_story_key.4007639146097054289#footer_action_list', '<html><head><title>Las Vegas Feb 2016</title></head></html>');
		});

		it('Facebook album with special character', function() {
			testAlbum('mbasic.facebook.com', '/teest.devisd/albums/1547833552211412/?refid=8#footer_action_list', '<html><head><title>Las Vegas Feb 2016</title></head></html>');
		});

		it('Facebook album with user id', function() {
			testAlbum('mbasic.facebook.com', '/100009834785112/albums/181006585570500/?refid=17#footer_action_list', '<html><head><title>Social Stream Photos</title></head></html>');
		});
	});

	describe('FacebookPhotoHandler:', function() {

		it('Facebook reshared cover photo should create a FacebookPhotoHandler...', () => {
			testPhoto('m.facebook.com', '/photo.php?fbid=10153780851052640&id=752997639&set=a.10152641596702640.1073741827.752997639&refid=7&_ft_=qid.6249087626036191071%3Amf_story_key.-4013527149064113699&__tn__=E', '<html><head><title>Cover Photos</title></head></html>');
		});

		it('Facebook timeline photos should create a FacebookPhotoHandler...', () => {
			testPhoto('https://mbasic.facebook.com', '/LostPerth/photos/a.483389675065425.1073741830.483374281733631/996130020458052/?type=3&refid=28&_ft_=qid.6249090976209629353%3Amf_story_key.-7445616791398603254', '<html><head><title>Timeline Photos</title></head></html>');
		});

		it('Facebook reshared profile photo should create a FacebookPhotoHandler...', () => {
			testPhoto('m.facebook.com', '/photo.php?fbid=10204384539172204&id=1792181807&set=a.1266866370405.33235.1792181807&bacr=1454983859%3A1454983859%3A3%3A5766516831948350138%3A1454863408%3A0%3A0%3A39&refid=7&_ft_=qid.6249108100110727269%3Amf_story_key.-4881070944758562218#footer_action_list', '<html><head><title>Profile Pictures</title></head></html>');
		});

		it('Facebook reshared profile photo (in lower case) should create a FacebookPhotoHandler...', () => {
			testPhoto('m.facebook.com', '/photo.php?fbid=172860119754694&id=100010921214514&set=a.128264367547603.1073741827.100010921214514&bacr=1455089477%3A1455089477%3A1%3A2840234676370608011%3A1455089369%3A0%3A0%3A120&refid=28&_ft_=qid.6249564199969238982%3Amf_story_key.8678473231216607696#footer_action_list', '<html><head><title>Profile pictures</title></head></html>');
		});

		it('Facebook photo from a post should create a FacebookPhotoHandler...', () => {
			testPhoto('m.facebook.com', '/photo.php?fbid=10153780851052640&id=752997639&set=a.10152641596702640.1073741827.752997639&refid=7&_ft_=qid.6249087626036191071%3Amf_story_key.-4013527149064113699&__tn__=E', '<html><head><title>Photos from Mike Bur&#039;s post</title></head></html>');
		});

		it('Facebook mobile upload should create a FacebookPhotoHandler...', () => {
			testPhoto('m.facebook.com', '/photo.php?fbid=752213434909402&id=100003622573857&set=a.392054280925321.1073741826.100003622573857&bacr=1454983859%3A1454983859%3A2%3A471088877557259645%3A1454981142%3A0%3A0%3A39&refid=7&_ft_=qid.6249108100110727269%3Amf_story_key.5766516831948350138#footer_action_list', '<html><head><title>Mobile Uploads</title></head></html>');
		});

		it('Random Facebook post from an album should create a FacebookPhotoHandler...', () => {
			testPhoto('m.facebook.com', '/photo.php?fbid=10153312088767823&id=561317822&set=p.10153312088767823&bacr=1455153649%3A1455153649%3A3%3A595428001658202341%3A1455104701%3A0%3A0%3A2&refid=8&_ft_=qid.6249837458472016581%3Amf_story_key.-6159159864915611870#footer_action_list', '<html><head><title>Cecilia Chu&#039;s photos</title></head></html>');
		});

		it('Facebook Photo page should create a FacebookPhotoHandler...', () => {
			testPhoto('https://mbasic.facebook.com', '/newideamagazine/photos/pcb.1149543165065149/1149542688398530/?type=3&source=48&refid=52&_ft_=qid.6251388079259600918%3Amf_story_key.6975273134394667543', '<html><head><title>Photo</title></head></html>');
		});

		it('Photo from Album has Album name as page title', () => {
			testPhoto('m.facebook.com', '/photo.php?fbid=1547833358878098&id=100009543463363&set=a.1547833552211412.1073741843.100009543463363&source=56', '<html><head><title>TestAlbum</title></head></html>');
		});
	});

	describe('FacebookProfileHandler tests:', function() {

		it('Facebook mobile profile should create a FacebookProfileHandler...', () => {
			testProfile('m.facebook.com', '/sebastian.walenzyk?refid=28&_ft_=qid.6235763022633113169%3Amf_story_key.-4743514777328396544&__tn__=C', '<html><head><title>Sebastian Walenzyk</title></head></html>');
		});

		it('Facebook mobile profile (with protocol) should create a FacebookProfileHandler...', () => {
			testProfile('https://m.facebook.com', '/sebastian.walenzyk?refid=28&_ft_=qid.6235763022633113169%3Amf_story_key.-4743514777328396544&__tn__=C', '<html><head><title>Sebastian Walenzyk</title></head></html>');
		});

		it('Facebook mobile profile (for groups) should create a FacebookProfileHandler...', () => {
			testProfile('https://m.facebook.com', '/groups/1667167856835981?refid=46&sld=eyJzZWFyY2hfc2lkIjoiMjFiYmJhODRjNjRlYzIzNDQ4MWZiYjdlOTVhMGUwYWMiLCJxdWVyeSI6InBlcnRoIGJlZXIgZWNvbm9teSIsInNlYXJjaF90eXBlIjoiU2VhcmNoIiwic2VxdWVuY2VfaWQiOjM0MzE5MjY0LCJwYWdlX251bWJlciI6MSwiZmlsdGVyX3R5cGUiOiJTZWFyY2giLCJlbnRfaWQiOjE2NjcxNjc4NTY4MzU5ODEsInBvc2l0aW9uIjowLCJyZXN1bHRfdHlwZSI6Njl9', '<html><head><title>Perth Beer Economy</title></head></html>');
		});

		it('Facebook mobile profile (for pages) should create a FacebookProfileHandler...', () => {
			testProfile('https://m.facebook.com', '/theprojecttv/?refid=7&_ft_=qid.6249086938766844195%3Amf_story_key.6058109930369709195&__tn__=C', '<html><head><title>The Project</title></head></html>');
		});
	});
	
	describe('FacebookNotificationsHandler tests:', function() {
	    
	    it('Facebook notifications', () => {
	        testNotifications('m.facebook.com', '/notifications.php', '<html></html>');
	    });
	    
	    it('Group notifications', () => {
	        testGroupNotifications('m.facebook.com', '/groups/1667167856835981?multi_permalinks=1786394024913363&seennotification=1462159857487815&gfid=AQD_RrS01QA0K66g&refid=48', '<html></html>');
	    });
	});
	
});
