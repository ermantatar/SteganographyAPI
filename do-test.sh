#!/bin/bash

#Invoked with 3 arguments:
#  URL:          URL on which server is running.
#  PPM_IMG_PATH: Path to a PPM image file.
#  MSG_PATH:     Path to file containing a message.
#
#Stores image specified by PPM_IMG_PATH, retrieves it and compares with
#original.  Then hides message specified by MSG_PATH in stored image;
#then it retrieves and displays first 60 chars of hidden message.
#
#If -v option specified, then display commands before execution.

if [ $# -lt 3  ] || [ $1 == '-v' -a $# -lt 4 ]
then
  echo "usage: $0 [-v] URL PPM_IMG_PATH MSG_PATH"
  exit 1;
fi

[ "$1" = '-v' ] && VERBOSE=true || VERBOSE=false
$VERBOSE && shift

TMP=/tmp
PPM=$TMP/img.ppm
HDR=$TMP/headers.txt
MSG=$TMP/msg.txt

API_URL="$1/api"
IMG_PATH="$2"
MSG_PATH="$3"

[ -e $IMG_PATH ] || { echo "$IMG_PATH does not exist" && exit 1; }
[ -e $MSG_PATH ] || { echo "$MSG_PATH does not exist" && exit 1; }

#store image
cmd="curl --silent 
          --form img='@$IMG_PATH'
          --dump-header '$HDR'
          --write-out '%{http_code}' 
	  --output /dev/null 
       '$API_URL/images/inputs'"
$VERBOSE && echo $cmd
status=`eval $cmd`

#check for success
[  $? -eq 0 -a $status -eq 201 ] ||  { echo "image store failed" && exit 1; }


#parse output to get value of location header
location=`cat "$HDR" | grep 'Location:' | cut -d ' ' -f 2- | 
    sed -e 's/[[:space:]]$//'`

#retrieve stored image
cmd="curl --silent --write-out '%{http_code}' --output '$PPM' '$location'"
$VERBOSE && echo $cmd
status=`eval $cmd`

#check for success
[ $? -eq 0 -a $status -eq 200 ] || { echo "image retrieve failed" && exit 1; }

cmd="cmp '$IMG_PATH' '$PPM'"
$VERBOSE && echo $cmd
eval $cmd
[ $? -eq 0 ] || { echo "comparison failed" && exit 1; }

#setup for hide
data="{ \"outGroup\": \"outputs\", \"msg\": \"`cat \"$MSG_PATH\"`\" }"
hideUrl=`echo $location | sed -e 's/images/steg/' -e 's/.ppm$//'`

#hide
cmd="curl --silent
          --header 'Content-Type: application/json' 
	  --request POST 
          --data '$data' 
	  --write-out '%{http_code}'
	  --output /dev/null
	  --dump-header '$HDR'
       '$hideUrl'"
$VERBOSE && echo $cmd
status=`eval $cmd`

#check for success
[  $? -eq 0 -a $status -eq 201 ] ||  { echo "hide failed" && exit 1; }

#parse output to get value of location header
location=`cat "$HDR" | grep 'Location:' | cut -d ' ' -f 2- | 
    sed -e 's/[[:space:]]$//'`

#unhide
cmd="curl --silent --write-out '%{http_code}' --output '$MSG' '$location'"
$VERBOSE && echo $cmd
status=`eval $cmd`

#check for success
[ $? -eq 0 -a $status -eq 200 ] || { echo "unhide failed" && exit 1; }

MAX=60
len=`cat $MSG | wc -c`
if [ $len -lt $MAX ]
then
    cat $MSG
    echo
else
    dd if=$MSG bs=$MAX count=1 2>/dev/null
    echo "..."; echo "truncated; total length: $len"
fi

rm -f "$PPM" "$HDR" "$MSG"


