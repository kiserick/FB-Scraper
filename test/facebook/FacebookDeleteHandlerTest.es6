import {FacebookDeleteHandler} from '../../src/facebook/FacebookDeleteHandler';
import {TestAid} from '../env/testAid.es6';

let subject = null;
let aid = new TestAid();
let chai = require('chai');
let htmlparser = require('htmlparser2');

describe('FacebookDeleteHandler ', function() {

    chai.should();
    this.error = (error) => assert('Error thrown', false);

    var execute = (html) => {
        var parser = new htmlparser.Parser(subject, {recognizeSelfClosing: true});
        parser.write(html);
        parser.done();
    };

    var doTest = (done, html, expectedPost) => {
        subject = new FacebookDeleteHandler((error, data) => {
            // Propagate error
            if (error) {
                this.error(error);
            }
            aid.validate(expectedPost, data.deleting);

            // Successful
            done();
        });
        execute(html);
    };

    describe('#parse', function () {

        it('scrape delete command information', function (done) {
            let pageHtml = '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Delete Post</title></head><body tabindex="0" class="b c d e"><div class="f"><div id="viewport"><div id="objects_container"><div class="e be" title="Delete Post"><h2>Delete Post</h2></div><div class="bf e" id="root" role="main"><div class="e be">Are you sure you want to delete this post?<form method="post" action="/a/delete.php?perm&story_permalink_token=S%3A_I100009834785112%3A273501259654365&continue=%2Fstories.php%23s_cbcd49e0daa660cea5de3b339c242cae&gfid=AQAh7slpNkAbXBez"><input type="hidden" name="fb_dtsg" value="AQE_A_cep1gP:AQEbOd1ueqhH" autocomplete="off" /><input type="hidden" name="charset_test" value="&#x20ac;,&#xb4;,&#x20ac;,&#xb4;,&#x6c34;,&#x414;,&#x404;" /><input value="Delete" type="submit" class="bg bh" /><a href="https://mbasic.facebook.com/story.php?story_fbid=273501259654365&id=100009834785112&refid=17&_ft_=top_level_post_id.273501259654365%3Atl_objid.273501259654365%3Athid.100009834785112%3A306061129499414%3A2%3A0%3A1464764399%3A-723554753820384022">Cancel</a></form></div></div></div></div></div></body></html>';
            let expected = {
            	fbDtsg: 'AQE_A_cep1gP:AQEbOd1ueqhH',
            	url: '/a/delete.php?perm&story_permalink_token=S%3A_I100009834785112%3A273501259654365&continue=%2Fstories.php%23s_cbcd49e0daa660cea5de3b339c242cae&gfid=AQAh7slpNkAbXBez'
            };

            doTest(done, pageHtml, expected);
        });
    });
});
