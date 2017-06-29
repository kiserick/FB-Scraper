import {FacebookShareHandler} from '../../src/facebook/FacebookShareHandler'
import {Share} from '../../src/facebook/data/share.es6'
import {TestAid} from '../env/testAid.es6'

let subject = null;
let aid = new TestAid();
let chai = require('chai');
let htmlparser = require('htmlparser2');

describe('FacebookShareHandling ', function() {

    chai.should();
    this.error = (error) => assert('Error thrown', false);

    var execute = (html) => {
        var parser = new htmlparser.Parser(subject, {recognizeSelfClosing: true});
        parser.write(html);
        parser.done();
    }

    var doTest = (done, html, expectedPost) => {
        subject = new FacebookShareHandler((error, data) => {
            // Propagate error
            if (error) {
                this.error(error);
            }

            // Validate the data
            aid.validate(expectedPost, data.share);

            // Successful
            done();
        });
        execute(html);
    }

    describe('#parse', function () {

        it('share post data scrape', function (done) {
            let pageHtml = '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Share on your Timeline</title><meta name="referrer" content="origin-when-crossorigin" id="meta_referrer" /><style type="text/css">/*<![CDATA[*/.ce{margin-bottom:4px;margin-top:4px;}.b .l{border:0;border-collapse:collapse;margin:0;padding:0;width:100%;}.b .l.ch{width:auto;}.b .l tbody{vertical-align:top;}.b .m>tr>td,.b .m>tbody>tr>td,.b .l td.m{vertical-align:middle;}.b .l td{padding:0;}.b .l td.ci{padding:2px;}.b .l td.bc{padding:4px;}.b .t{width:100%;}.ba{background:#fff;}.g{background:#e9eaed;}.b .ci{padding:2px;}.b .bc{padding:4px;}form{margin:0;border:0;}.bd{color:#4e5665;font-size:12px;white-space:nowrap;}.be{background-color:#fff;border:0;display:inline-block;height:26px;line-height:26px;margin:0;padding-right:16px;position:relative;vertical-align:top;white-space:nowrap;}.be input,.be button{color:#3b5998;}.be a:hover{color:#fff;}.be.bf,.bj.bf{height:20px;line-height:20px;}.bj{-moz-appearance:none;background-color:#fff;border:none;color:#4e5665;display:inline-block;font-size:12px;height:26px;min-width:100%;padding:0;vertical-align:top;}.be a.bj{color:#4e5665;}.bk{background-image:url(https://fbstatic-a.akamaihd.net/rsrc.php/v2/y7/r/Gm9JuAvZCI7.png);background-position:right center;background-repeat:no-repeat;bottom:0;display:block;pointer-events:none;position:absolute;right:0;top:0;width:16px;}.bi{text-align:left;}.bn{background:#fff;}.bl .br{background-color:transparent;color:#4e5665;display:block;padding:0;width:100%;}.b .bl .bm{border:1px solid #9197a3;}.bp{-moz-appearance:none;border:0;margin:0;padding:0;}.cf.cf{display:block;}.cg{display:inline-block;}.cg .cn{display:block;font-size:small;white-space:normal;}.cj,.ck.s{cursor:pointer;display:block;}.b .ck{padding:2px;}.b .cg a.cn,.cg .cn{color:#4e5665;font-weight:bold;text-align:left;}.b .cg a.cn:hover,.b .cg a.cn:focus,.cg .cn:hover,.cg .cn:focus{background:#4e5665;color:#fff;}.b .cg a.cj:hover,.b .cg a.cj:focus,.cg .cj:hover,.cg .cj:focus{background:inherit;}.s{border:0;display:inline-block;vertical-align:top;}i.s u{position:absolute;width:0;height:0;overflow:hidden;}.cm{-moz-appearance:none;background-color:transparent;border:0;display:inline;font-size:inherit;margin:0;padding:0;}.cm:hover{background-color:#3b5998;color:#fff;white-space:normal;}.co{color:#3b5998;}.cp{-moz-appearance:none;background:none;display:inline-block;font-size:12px;height:28px;line-height:28px;margin:0;overflow:visible;padding:0 9px;text-align:center;vertical-align:top;white-space:nowrap;}.b .cp{border-radius:2px;}.cr,a.cr,html .b a.cr{color:#fff;}.b .cr{background-color:#4e69a2;border:1px solid #385490;}.b a.cr:hover,.b .cr:hover{background-color:#465e91;}.cr[disabled]{color:#899bc1;}.b .cr[disabled]:hover{background-color:#4e69a2;}.b a.cp::after{content:"";display:inline-block;height:100%;vertical-align:middle;}.cp.cq{display:block;width:100%;}a.cp.cq,.b label.cp.cq{display:block;width:auto;}.b .cp{padding:0 8px;}.b a.cp{height:26px;line-height:26px;}.b .bs{margin-top:4px;padding:0;}.bv{background:#f3f4f7;border:1px solid #ccc;border-radius:2px;font-family:helvetica, arial, sans-serif;font-size:12px;font-weight:bold;line-height:16px;position:relative;}.bx img{max-height:60px;max-width:60px;}.bx{background-color:#fff;float:left;line-height:0;margin:8px 9px 8px 8px;min-width:60px;}.by{color:#3e4350;overflow:hidden;padding:8px 8px 8px 12px;white-space:pre-wrap;word-wrap:break-word;}.bw .by{padding-left:0;}.cb{font-weight:normal;margin-top:2px;}.bt{background-color:#fff;}.bu{padding:4px 3px;}.ca{color:#000;}.cc{color:gray;}.bz{font-size:small;}body,tr,input,textarea,.h{font-size:medium;}.cd{clear:both;}body{text-align:left;direction:ltr;}body,tr,input,textarea,button{font-family:sans-serif;}body,p,figure,h1,h2,h3,h4,h5,h6,ul,ol,li,dl,dd,dt{margin:0;padding:0;}h1,h2,h3,h4,h5,h6{font-size:1em;font-weight:bold;}ul,ol{list-style:none;}article,aside,figcaption,figure,footer,header,nav,section{display:block;}.e #viewport{margin:0 auto;max-width:600px;}#page{position:relative;}.i{background-color:#3b5998;color:#fff;}.i .q{padding:6px;}.i .v.v{font-size:small;font-weight:normal;}.y{background-position:center center;background-repeat:no-repeat;display:block;font-size:small;height:12px;margin:2px;padding:5px;white-space:nowrap;width:12px;}.y:hover{background-image:url(https://fbstatic-a.akamaihd.net/rsrc.php/v2/yU/r/8hVZmswHyRB.png);}.y{background-image:url(https://fbstatic-a.akamaihd.net/rsrc.php/v2/yJ/r/CMXwnKcwXks.png);}.j .y,.j .y:hover{background-image:none;height:auto;width:auto;}.q{display:block;padding:5px;}.k .u{table-layout:fixed;width:100%;}.r,.r.s{display:block;}.o{display:block;}.p{height:14px;width:14px;}.b a,.b a:visited{color:#3b5998;text-decoration:none;}.b .x,.b .x:visited{color:#fff;}.b a:focus,.b a:hover{background-color:#3b5998;color:#fff;}.b .x:focus,.b .x:hover{background-color:#fff;color:#3b5998;}.w{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}/*]]>*/</style></head><body tabindex="0" class="b c d e f g"><div class="h"><div id="viewport"><div id="toggleHeader"></div><div class="i j k" id="header"><table class="l m"><tbody><tr><td class="n"><a class="o p q" href="/home.php?ref_component=mbasic_home_logo&amp;ref_page=XComposerMBasicController"><img src="https://fbstatic-a.akamaihd.net/rsrc.php/v2/yR/r/aOwaKgucSnh.png" width="14" height="14" class="r s" alt="Facebook logo" /></a></td><td class="t"><table class="l m u"><tbody><tr><td class="t"><h1 class="v w">Share on your Timeline</h1></td></tr></tbody></table></td><td class="n"><a class="x y" href="/composer/mbasic/?csid=c46d1ee7-c145-4b0c-b3de-16e1d5088216&amp;av=100009543463363&amp;discard&amp;view_overview">Cancel</a></td></tr></tbody></table></div><div id="objects_container"><div class="z g" id="root" role="main"><table class="l"><tbody><tr><td class="ba t bb"><div class="bc"><form method="post" action="/composer/mbasic/?csid=c46d1ee7-c145-4b0c-b3de-16e1d5088216&amp;incparms%5B0%5D=xc_message&amp;av=100009543463363" enctype="multipart/form-data"><input type="hidden" name="fb_dtsg" value="AQEha5lv7ggW:AQG43uOooFq1" autocomplete="off" /><input type="hidden" name="charset_test" value="&#x20ac;,&#xb4;,&#x20ac;,&#xb4;,&#x6c34;,&#x414;,&#x404;" /><input type="hidden" name="at" /><input type="hidden" name="target" value="100009543463363" /><input type="hidden" name="csid" value="c46d1ee7-c145-4b0c-b3de-16e1d5088216" /><input type="hidden" name="c_src" value="share" /><input type="hidden" name="referrer" value="feed" /><input type="hidden" name="ctype" value="advanced" /><input type="hidden" name="cver" value="amber_share" /><input type="hidden" name="users_with" /><input type="hidden" name="album_id" /><input type="hidden" name="waterfall_source" value="advanced_composer_timeline" /><input type="hidden" name="privacyx" value="300645083384735" /><input type="hidden" name="appid" value="0" /><input type="hidden" name="sid" value="1063521280358325" /><input type="hidden" name="linkUrl" /><input type="hidden" name="m" value="self" /><span class="bd">Share with:&nbsp;<label class="be bf bg"><input value="Public" type="submit" name="view_privacy" class="bh bi bj bf" /><div class="bk"></div></label></span><div class="bl"><table class="l bm bn"><tbody><tr><td class="t bo m"><textarea class="bp bq br" name="xc_message" rows="3"></textarea></td></tr></tbody></table></div><div class="bs bt bu"><div class="bv bw"><div class="bx"><img src="https://fbcdn-photos-a-a.akamaihd.net/hphotos-ak-xft1/v/t1.0-0/cp0/e15/q65/p130x130/13133093_1063521280358325_3845706102695084625_n.jpg?efg=eyJpIjoiYiJ9&amp;oh=f58d89b852c487343bf2cf4719e39b4b&amp;oe=57AFBA84&amp;__gda__=1470269597_bc6bb5b46072b6d02f927b7c5305158d" width="60" class="s" /></div><div class="by"><span class="bz ca"><strong>From the album:</strong> Timeline Photos</span><div class="cb"><span class="bz cc">By Australian Red Cross Blood Service</span></div></div><div class="cd"></div></div></div><div class="ce"><div class="cf cg"><table class="l ch m"><tbody><tr><td class="ci n"><label for="u_0_0" class="cj"><img src="https://fbstatic-a.akamaihd.net/rsrc.php/v2/yE/r/Q-U_WZzAqVP.png" width="16" height="16" class="ck cl s" /></label></td><td class="ci n"><input value="Tag Friends" type="submit" name="view_withtag" class="bh cm cn co" id="u_0_0" /></td></tr></tbody></table></div><div class="cf cg"><table class="l ch m"><tbody><tr><td class="ci n"><label for="u_0_1" class="cj"><img src="https://fbstatic-a.akamaihd.net/rsrc.php/v2/yW/r/gqS520QVYNv.png" width="16" height="16" class="ck cl s" /></label></td><td class="ci n"><input value="Add Location" type="submit" name="view_location" class="bh cm cn co" id="u_0_1" /></td></tr></tbody></table></div><div class="cf cg"><table class="l ch m"><tbody><tr><td class="ci n"><label for="u_0_2" class="cj"><img src="https://fbstatic-a.akamaihd.net/rsrc.php/v2/ym/r/s_JBnFooj2Z.png" width="16" height="16" class="ck cl s" /></label></td><td class="ci n"><input value="Add Feeling or Activity" type="submit" name="view_minutiae" class="bh cm cn co" id="u_0_2" /></td></tr></tbody></table></div></div><input value="Share" type="submit" name="view_post" class="bh cp cq cr" /></form></div></td></tr></tbody></table></div></div></div></div></body></html>';

            // Create the expected post (with additional properties for multiple photos)
            let expectedShare = {
                csid: 'c46d1ee7-c145-4b0c-b3de-16e1d5088216',
                fb_dtsg: 'AQEha5lv7ggW:AQG43uOooFq1',
                target: '100009543463363',
                privacyx: '300645083384735',
                sid: '1063521280358325'
            };

            // Undertake test
            doTest(done, pageHtml, expectedShare);
        });
    });
});
