<?php
/* EDIT EMAIL AND PASSWORD */
//$EMAIL      = "socmedallinone@gmail.com";
//$PASSWORD   = "SocialMediaAllIn1";
$EMAIL      = "socmedallinone@gmail.com";
$PASSWORD   = "SocialMediaAllIn1";

function cURL($url, $header=NULL, $cookie=NULL, $p=NULL)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_HEADER, $header);
    curl_setopt($ch, CURLOPT_NOBODY, $header);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_COOKIE, $cookie);
    curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 10);
    if ($p) {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $p);
    }
    $result = curl_exec($ch);
    if ($result) {
        return $result;
    } else {
        return curl_error($ch);
    }
    curl_close($ch);
}
$a = cURL("https://m.facebook.com/login.php?login_attempt=1",true,null,"email=$EMAIL&pass=$PASSWORD");
preg_match('%Set-Cookie: ([^;]+);%',$a,$b);
$c = cURL("https://m.facebook.com/login.php?login_attempt=1",true,$b[1],"email=$EMAIL&pass=$PASSWORD");
preg_match_all('%Set-Cookie: ([^;]+);%',$c,$d);
$cookie = "";
for($i=0;$i<count($d[0]);$i++)
    $cookie.=$d[1][$i].";";
/*
NOW TO JUST OPEN ANOTHER URL EDIT THE FIRST ARGUMENT OF THE FOLLOWING FUNCTION.
TO SEND SOME DATA EDIT THE LAST ARGUMENT.
*/
//echo $b[1];
//$cookie="noscript=1;c_user=100002881193640;dats=1;fr=0NPfcmr6VF7JJK4b6.AWUAl_jOsr6MP3gG2GI_pkS0i6g.BZQ9E2.0f.AAA.0.0.BZQ9FQ.AWXIPq4C;lu=gA;m_pixel_ratio=2;sb=UNFDWdKtZF_0LFt1w-MkLvOz;xs=43%3AYQhOAHNI5Q4hyQ%3A2%3A1497616720%3A10317%3A9841;";

$data = cURL("https://m.facebook.com/",null,$cookie,null);
$new_cookie="noscript=1;m_pixel_ratio=2;dats=1;";
$new_lu="";
$new_fr="";
$new_user="";
$new_datr="";
$new_xs="";
$new_sb="";
$ck_arr = explode(';', $cookie);

foreach ($ck_arr as $cks)
{
    $ckf_arr = explode('=', $cks);
    if ($ckf_arr[0]=="c_user") $new_user=$cks.";";
    if ($ckf_arr[0]=="datr") $new_datr=$cks.";";
    if ($ckf_arr[0]=="lu") $new_lu=$cks.";";
    if ($ckf_arr[0]=="sb") $new_sb=$cks.";";
    if ($ckf_arr[0]=="xs") $new_xs=$cks.";";
    if ($ckf_arr[0]=="fr") $new_fr=$cks;
}
$new_cookie=$new_datr.$new_fr;
echo $new_cookie;

?>