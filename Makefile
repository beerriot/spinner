all:
	mkdir spinner.wdgt
	cp Info.plist spinner.wdgt
	cp Default.png spinner.wdgt
	cp Icon.png spinner.wdgt
	cp spinner.html spinner.wdgt
	cp spinner.css spinner.wdgt
	cp spinner.js spinner.wdgt
	cp buttonback.png spinner.wdgt
	cp buttonbackdis.png spinner.wdgt
	cp backsidewidget.svg spinner.wdgt
	cp iphoneicon.png spinner.wdgt
	cp iphonelaunch.png spinner.wdgt

clean:
	rm -r spinner.wdgt

