#!/bin/bash

BASE_URL="http://ftp.itec.aau.at/datasets/DASHDataset2014"

usage()
{
	echo "Usage : "$0" [-h] NAME LENGTH QUALITY"
	echo "    NAME:       name of the video"
	echo "    LENGTH:     length of the segments"
	echo "    QUALITY:    quality of the video"
	echo "Run '"$0" list' to list all available names"
	echo "Run '"$0" NAME list' to list all available lengths"
	echo "Run '"$0" NAME LENGTH list' to list all available qualities"
	exit 1
}

list_names()
{
	curl -s -L "$BASE_URL/" | grep -Po '(?<=href=")[a-zA-Z0-9_-]*'
}

list_lengths()
{
	curl -s -L "${BASE_URL}/${NAME}/" | grep -Po '(?<=href=")[a-zA-Z0-9_-]*'
}

list_qualities()
{
	curl -s -L "${BASE_URL}/${NAME}/${LENGTH}/" | grep -v "\.mpd" | grep -Po '(?<=href=")[a-zA-Z0-9_-]*'
}

list_mpds()
{
	curl -s -L "${BASE_URL}/${NAME}/${LENGTH}/" | grep "\.mpd" | grep -Po '(?<=href=")[a-zA-Z0-9._-]*'
}

list_files()
{
	curl -s -L "${BASE_URL}/${NAME}/${LENGTH}/${QUALITY}/" | grep -v "nonSeg\.mp4" | grep -Po '(?<=href=")[a-zA-Z0-9._-]*'
}

download()
{
	# Fetch all files
	FILES=$(list_files)
	if [[ -z $FILES ]]; then
		return
	fi
	# Create dir
	mkdir -p ./${NAME}/${LENGTH}/${QUALITY}
	# Download mpd files
	cd ${NAME}/${LENGTH}
	rm *.mpd 2>/dev/null
	MPDS=$(list_mpds)
	for mpd in ${MPDS} ; do
		wget -q "${BASE_URL}/${NAME}/${LENGTH}/${mpd}"
	done
	# Download video files
	cd ${QUALITY}
	for file in ${FILES} ; do
		wget -nc -q "${BASE_URL}/${NAME}/${LENGTH}/${QUALITY}/${file}"
	done
	# Remove unused qualities from mpd
	# Asume that folder names are name_${bandwidth}bps
	cd ..
	for mpd in $(find . -name "*.mpd") ; do
		ALL_QUALITIES=$(cat ${mpd} | grep -Po '(?<=bandwidth=")[0-9]*')
		INSTALLED_QUALITIES=$(find . -maxdepth 1 -mindepth 1 -name "*_*bps" -type d | awk -F '_' '{print $2}' | awk -F 'bps' '{print $1}')
		MISSING_QUALITIES=$(echo -e "${ALL_QUALITIES[@]}\n${INSTALLED_QUALITIES[@]}" | sort | uniq -u)
		for quality in $MISSING_QUALITIES ; do
			sed -i "/bandwidth=\"$quality\"/d" $mpd
		done
	done
}

NAME=${1}
LENGTH=${2}
QUALITY=${3}

if [ "a$QUALITY" == "alist" ]; then
	list_qualities
elif [ "a$QUALITY" == "a" ]; then
	if [ "a$LENGTH" == "alist" ]; then
		list_lengths
	elif [ "a$LENGTH" == "a" ]; then
		if [ "a$NAME" == "alist" ]; then
			list_names
		else
			usage
		fi
	else
		usage
	fi
else
	download
fi
