const parser = require('fast-xml-parser');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

function loadSource (filename) {
  const source = readFile(filename);
  return source;
}

const options = {
  ignoreAttributes: true,
  ignoreNameSpace: false,
  parseNodeValue: true,
  parseAttributeValue: false,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false, //"strict",
};

const missingAttribute = (filename,attribute) => loadSource(filename)
  .then(xmlData => xmlData.toString())
  .then(xmlData => {
    if (parser.validate(xmlData) === true) {
      var sourceList = parser.parse(xmlData, options)['b:Sources']['b:Source'];
      const missingAccessDateList = sourceList.filter(source => !source.hasOwnProperty(attribute));
      return missingAccessDateList;
    } else console.log('invalid XML');
  });

/**
 *  Extracts entries with missing Attribute and exports them to a separate file
 * @param {String} filename 
 * @param {String} attribute 
 */
function analyzeXML (filename,attribute) {
  missingAttribute(filename,attribute).then(data => {
    console.log(`Sum of Elements without "${attribute}": ${data.length}'\n\nExport to missingAttribute.xml`);
    return data;
  }).then(data => {
    console.log(data);
    return { 'b:Sources': { 'b:Source': data } }
  })
  .then(data => {
    const xmldata = new parser.j2xParser().parse(data).replace('<b:Sources>', '<?xml version="1.0" encoding="UTF-8"?><b:Sources xmlns:b = "http://schemas.openxmlformats.org/officeDocument/2006/bibliography" xmlns = "http://schemas.openxmlformats.org/officeDocument/2006/bibliography" SelectedStyle = "" > ');
    fs.writeFileSync('missingAttribute.xml', xmldata);
  })
}

/**
 * Adds Accessdate attributes to each entry and exports fixed entries in a separate file
 * @param {*} filename 
 * @param {*} outputFilename 
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function fixAccessDate (filename, outputFilename, year, month, day) {
  missingAttribute(filename,'b:YearAccessed').then(data => data.map(entry => {
    return {
      ...entry,
      'b:YearAccessed': year,
      'b:MonthAccessed': month,
      'b:DayAccessed': day
    };
  })).then(data => {
    return { 'b:Sources': { 'b:Source': data } }
  }).then(data => {
    const xmldata = new parser.j2xParser().parse(data).replace('<b:Sources>', '<?xml version="1.0" encoding="UTF-8"?><b:Sources xmlns:b = "http://schemas.openxmlformats.org/officeDocument/2006/bibliography" xmlns = "http://schemas.openxmlformats.org/officeDocument/2006/bibliography" SelectedStyle = "" > ');
    fs.writeFileSync(outputFilename, xmldata);
    console.log(`Fixed Export to ${outputFilename}`);
  })
}

/**
 * Adds "o.J." (German abbreviation for no date) to each entry without a date and exports fixed entries in a separate file
 * @param {*} filename 
 * @param {*} outputFilename 
 */
function fixDate (filename, outputFilename) {
  missingAttribute(filename, 'b:Year').then(data => data.map(entry => {
    return {
      ...entry,
      'b:Year': 'o.J.',
    };
  })).then(data => {
    return { 'b:Sources': { 'b:Source': data } }
  }).then(data => {
    const xmldata = new parser.j2xParser().parse(data).replace('<b:Sources>', '<?xml version="1.0" encoding="UTF-8"?><b:Sources xmlns:b = "http://schemas.openxmlformats.org/officeDocument/2006/bibliography" xmlns = "http://schemas.openxmlformats.org/officeDocument/2006/bibliography" SelectedStyle = "" > ');
    fs.writeFileSync(outputFilename, xmldata);
    console.log(`Fixed Export to ${outputFilename}`);
  })
}

const filename = 'Sources.xml';
analyzeXML(filename,'b:Year');
// fixAccessDate(filename,'fixedAccessDate.xml', 2019, 12, 05);
fixDate(filename,'fixedDate.xml');
