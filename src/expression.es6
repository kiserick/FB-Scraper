export class Expression {}

Expression.ALBUM_URL_REGEX = /^\/?[a-zA-Z0-9_.]+\/albums\/[0-9]+/;

Expression.COMMENT_POST_URL_REGEX = /^\/a\/comment.php/;

Expression.DELETE_POST_REGEX = /^\/delete\.php/;

Expression.DYNAMIC_PHOTO_URL_REGEX = /^\/[a-zA-Z0-9/_.]*photo.php\?/;

Expression.GROUP_POST_URL_REGEX = /^\/?groups\/[0-9]+\?view=permalink&id=[0-9]+&/;

Expression.FEED_URL_REGEX = /^(?:\/$|$|\/home.php|\/stories.php\?aftercursorr=)/;

Expression.NOTIFICATION_GROUP_POST_REGEX = /^\/groups\/[a-zA-Z0-9]+\?multi_permalinks=/;

Expression.NOTIFICATION_PATH_REGEX = /^\/notifications.php/;

Expression.NOTIFICATION_PROFILE_REDIRECT_REGEX = /^(.+?)&seennotification=.+?&gfid=.+?&refid=.+?/;

Expression.NOTIFICATION_REDIRECTURL_VALID = /(groups\/[0-9]+|story.php|events\/[0-9]+|comment\/replies)/;

Expression.PHOTO_URL_REGEX = /^\/[a-zA-Z0-9_.]*\/photos\//;

Expression.POST_URL_REGEX = /^\/?story.php\?story_fbid=[0-9]+(&substory_index=[0-9])?&id=[0-9]+/;

Expression.REGEX_COMPOSE_FORM = /composer\/mbasic\/\?/;

Expression.REGEX_IMAGEURL_QUERIES = /([^\s]+\.[befgijmnpt]{3,4})(?:\?|$)/

Expression.REGEX_URL_SENDPOST = /^(?:\/#|)mbasic_inline_feed_composer$/;

Expression.SHARE_POST_URL_REGEX = /^\/composer\/mbasic\/\?c_src=share/;