{
	"translatorID": "ac277fbe-000c-46da-b145-fbe799d17eda",
	"label": "MIT Press Books",
	"creator": "Guy Aglionby",
	"target": "https://(www\\.)?mitpress\\.mit\\.edu/(mit-press-open|contributors|search|series|distribution|topics|forthcoming|best-sellers|books)",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2019-12-28 18:25:46"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2019 Guy Aglionby
	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero.  If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

function detectWeb(doc, url) {
	if (url.includes('/books/') && !url.includes('/series/') && !url.includes('/distribution/') && !url.includes('/imprint/')) {
		return 'book';
	}
	else if (getSearchResults(doc, true)) {
		return 'multiple';
	}
	return false;
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) === 'multiple') {
		Zotero.selectItems(getSearchResults(doc, false), function (selected) {
			if (selected) {
				ZU.processDocuments(Object.keys(selected), scrape);
			}
		});
	}
	else {
		scrape(doc);
	}
}

function scrape(doc, url) {
	let item = new Zotero.Item('book');
	item.url = url;
	item.place = 'Cambridge, MA, USA';
	item.language = 'en';
	item.date = ZU.xpathText(doc, '(//time[@property = "publishDate"]/@content)[1]');
	item.ISBN = ZU.xpathText(doc, '(//span[@property = "isbn"])[1]');
	item.numPages = ZU.xpathText(doc, '(//span[@property = "numPages"])[1]');
	
	let abstract = doc.querySelector('div.book__blurb');
	if (abstract) {
		item.abstractNote = abstract.textContent.trim();
	}
	
	let title = ZU.xpathText(doc, '//h1[@class = "book__title"]').trim();
	
	let editionRegex = /, (([\w ]+) edition( [\w ]+)?)/i;
	let matchedEdition = title.match(editionRegex);
	if (matchedEdition) {
		// Only include "Edition" in the field if there's text after it
		if (matchedEdition[3]) {
			item.edition = matchedEdition[1];
		}
		else {
			item.edition = matchedEdition[2];
		}
		title = title.replace(matchedEdition[0], '');
	}
	
	let volumeRegex = /, volume (\d+)/i;
	let matchedVolume = title.match(volumeRegex);
	if (matchedVolume) {
		item.volume = matchedVolume[1];
		title = title.replace(matchedVolume[0], '');
	}
	
	let subtitle = ZU.xpathText(doc, '//h2[@class = "book__subtitle"]');
	if (subtitle) {
		subtitle = subtitle.trim();
		item.title = [title, subtitle].join(': ');
	}
	else {
		item.title = title;
	}
	
	const contributorTypes = [['By', 'author'], ['Translated by', 'translator'], ['Edited by', 'editor']];
	let allContributors = ZU.xpath(doc, '//span[@class = "book__authors"]/p');
	allContributors.forEach(function (contributorLine) {
		contributorLine = contributorLine.textContent;
		contributorTypes.forEach(function (contributorType) {
			if (contributorLine.startsWith(contributorType[0])) {
				let contributors = contributorLine.replace(contributorType[0], '').split(/ and |,/);
				contributors.forEach(function (contributorName) {
					item.creators.push(ZU.cleanAuthor(contributorName, contributorType[1]));
				});
			}
		});
	});
	
	let series = ZU.xpathText(doc, '//p[@class = "book__series"]/a[contains(@href, "/series/")]');
	if (series) {
		item.series = series.trim();
	}
	
	let publisher = ZU.xpathText(doc, '//p[@class = "book__series"]/a[contains(@href, "/imprint/") or contains(@href, "/distribution/")]');
	if (publisher) {
		item.publisher = publisher.trim();
	}
	else {
		item.publisher = 'MIT Press';
	}
	
	let openAccessUrl = ZU.xpathText(doc, '//div[contains(@class, "open-access")]/a/@href');
	if (openAccessUrl) {
		if (openAccessUrl.endsWith('.pdf') || openAccessUrl.endsWith('.pdf?dl=1')) {
			item.attachments.push({
				url: openAccessUrl,
				title: 'Full Text PDF',
				mimeType: 'application/pdf'
			});
		}
		else {
			item.attachments.push({
				url: openAccessUrl,
				title: 'Open Access',
				mimeType: 'text/html'
			});
		}
	}
	
	item.complete();
}

function getSearchResults(doc, checkOnly) {
	let rows = ZU.xpath(doc, '//ul[contains(@class, "results__list")]//a[@property = "name"]');
	
	if (checkOnly) {
		return rows.length > 0;
	}
	
	let items = {};
	for (let i = 0; i < rows.length; i++) {
		items[rows[i].href] = rows[i].text.trim();
	}
	return items;
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/search?keywords=deep+learning",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/contributors/ian-goodfellow",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/series/adaptive-computation-and-machine-learning-series",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/imprint/bradford-book",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/distribution/urbanomic",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/elements-causal-inference",
		"items": [
			{
				"itemType": "book",
				"title": "Elements of Causal Inference: Foundations and Learning Algorithms",
				"creators": [
					{
						"firstName": "Jonas",
						"lastName": "Peters",
						"creatorType": "author"
					},
					{
						"firstName": "Dominik",
						"lastName": "Janzing",
						"creatorType": "author"
					},
					{
						"firstName": "Bernhard",
						"lastName": "Schölkopf",
						"creatorType": "author"
					}
				],
				"date": "2017-11-29",
				"ISBN": "9780262037310",
				"abstractNote": "A concise and self-contained introduction to causal inference, increasingly important in data science and machine learning.",
				"language": "en",
				"libraryCatalog": "MIT Press Books",
				"numPages": "288",
				"place": "Cambridge, MA, USA",
				"publisher": "MIT Press",
				"series": "Adaptive Computation and Machine Learning series",
				"shortTitle": "Elements of Causal Inference",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/sciences-artificial-reissue-third-edition-new-introduction-john-laird",
		"items": [
			{
				"itemType": "book",
				"title": "The Sciences of the Artificial",
				"creators": [
					{
						"firstName": "Herbert A.",
						"lastName": "Simon",
						"creatorType": "author"
					}
				],
				"date": "2019-08-13",
				"ISBN": "9780262537537",
				"abstractNote": "Herbert Simon's classic work on artificial intelligence in the expanded and updated third edition from 1996, with a new introduction by John E. Laird.",
				"edition": "Reissue Of The Third Edition With A New Introduction By John Laird",
				"language": "en",
				"libraryCatalog": "MIT Press Books",
				"numPages": "256",
				"place": "Cambridge, MA, USA",
				"publisher": "MIT Press",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/construction-site-possible-worlds",
		"items": [
			{
				"itemType": "book",
				"title": "Construction Site for Possible Worlds",
				"creators": [
					{
						"firstName": "Amanda",
						"lastName": "Beech",
						"creatorType": "editor"
					},
					{
						"firstName": "Robin",
						"lastName": "Mackay",
						"creatorType": "editor"
					},
					{
						"firstName": "James",
						"lastName": "Wiltgen",
						"creatorType": "editor"
					}
				],
				"date": "2020-10-11",
				"ISBN": "9781913029579",
				"abstractNote": "Perspectives from philosophy, aesthetics, and art on how to envisage the construction site of possible worlds.",
				"language": "en",
				"libraryCatalog": "MIT Press Books",
				"numPages": "136",
				"place": "Cambridge, MA, USA",
				"publisher": "Urbanomic",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/ribbon-olympias-throat",
		"items": [
			{
				"itemType": "book",
				"title": "The Ribbon at Olympia's Throat",
				"creators": [
					{
						"firstName": "Michel",
						"lastName": "Leiris",
						"creatorType": "author"
					},
					{
						"firstName": "Christine",
						"lastName": "Pichini",
						"creatorType": "translator"
					}
				],
				"date": "2019-07-02",
				"ISBN": "9781635900842",
				"abstractNote": "Short fragments and essays that explore how a seemingly irrelevant aesthetic detail may cause the eruption of sublimity within the mundane.",
				"language": "en",
				"libraryCatalog": "MIT Press Books",
				"numPages": "288",
				"place": "Cambridge, MA, USA",
				"publisher": "Semiotext(e)",
				"series": "Semiotext(e) / Native Agents",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/foundations-machine-learning-second-edition",
		"items": [
			{
				"itemType": "book",
				"title": "Foundations of Machine Learning",
				"creators": [
					{
						"firstName": "Mehryar",
						"lastName": "Mohri",
						"creatorType": "author"
					},
					{
						"firstName": "Afshin",
						"lastName": "Rostamizadeh",
						"creatorType": "author"
					},
					{
						"firstName": "Ameet",
						"lastName": "Talwalkar",
						"creatorType": "author"
					}
				],
				"date": "2018-12-25",
				"ISBN": "9780262039406",
				"abstractNote": "A new edition of a graduate-level machine learning textbook that focuses on the analysis and theory of algorithms.",
				"edition": "Second",
				"language": "en",
				"libraryCatalog": "MIT Press Books",
				"numPages": "504",
				"place": "Cambridge, MA, USA",
				"publisher": "MIT Press",
				"series": "Adaptive Computation and Machine Learning series",
				"attachments": [
					{
						"title": "Open Access",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/collapse-volume-8",
		"items": [
			{
				"itemType": "book",
				"title": "Collapse: Casino Real",
				"creators": [
					{
						"firstName": "Robin",
						"lastName": "Mackay",
						"creatorType": "editor"
					}
				],
				"date": "2018-10-23",
				"ISBN": "9780956775023",
				"abstractNote": "An assembly of perspectives on risk, contingency, and chance—at the gaming table, in the markets, and in life.",
				"language": "en",
				"libraryCatalog": "MIT Press Books",
				"numPages": "1020",
				"place": "Cambridge, MA, USA",
				"publisher": "Urbanomic",
				"series": "Urbanomic / Collapse",
				"shortTitle": "Collapse",
				"volume": "8",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/reinforcement-learning-second-edition",
		"items": [
			{
				"itemType": "book",
				"title": "Reinforcement Learning: An Introduction",
				"creators": [
					{
						"firstName": "Richard S.",
						"lastName": "Sutton",
						"creatorType": "author"
					},
					{
						"firstName": "Andrew G.",
						"lastName": "Barto",
						"creatorType": "author"
					}
				],
				"date": "2018-11-13",
				"ISBN": "9780262039246",
				"abstractNote": "The significantly expanded and updated new edition of a widely used text on reinforcement learning, one of the most active research areas in artificial intelligence.",
				"edition": "Second",
				"language": "en",
				"libraryCatalog": "MIT Press Books",
				"numPages": "552",
				"place": "Cambridge, MA, USA",
				"publisher": "A Bradford Book",
				"series": "Adaptive Computation and Machine Learning series",
				"shortTitle": "Reinforcement Learning",
				"attachments": [
					{
						"title": "Open Access",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/architecture-and-action",
		"items": [
			{
				"itemType": "book",
				"title": "Architecture and Action",
				"creators": [
					{
						"firstName": "J. Meejin",
						"lastName": "Yoon",
						"creatorType": "editor"
					},
					{
						"firstName": "Irina",
						"lastName": "Chernyakova",
						"creatorType": "editor"
					}
				],
				"date": "2019-07-02",
				"ISBN": "9780998117065",
				"abstractNote": "Projects and texts that address architecture's role in taking on complex global challenges including climate change, housing, migration, and social justice.",
				"language": "en",
				"libraryCatalog": "MIT Press Books",
				"numPages": "350",
				"place": "Cambridge, MA, USA",
				"publisher": "SA+P Press",
				"series": "Agendas in Architecture",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://mitpress.mit.edu/books/america-over-water-revised-and-expanded-edition",
		"items": [
			{
				"itemType": "book",
				"title": "America Over the Water: A Historic Journey into the Cultural Roots of Traditional American Music",
				"creators": [
					{
						"firstName": "Shirley",
						"lastName": "Collins",
						"creatorType": "author"
					}
				],
				"date": "2020-10-20",
				"ISBN": "9781907222924",
				"abstractNote": "The chronicle of a year spent discovering the traditional musicians of the American South, including Mississippi Fred McDowell, Muddy Waters, and many others.",
				"edition": "Revised And Expanded",
				"language": "en",
				"libraryCatalog": "MIT Press Books",
				"numPages": "248",
				"place": "Cambridge, MA, USA",
				"publisher": "Strange Attractor Press",
				"shortTitle": "America Over the Water",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
