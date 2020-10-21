const gulp = require('gulp')
const git = require('gulp-git')
const execa = require('execa')
const fs = require('fs-extra')
const path = require('path')
const argv = require('yargs').argv
const semver = require('semver')

function appPath(str) {
  return path.join(__dirname, str)
}

function templatePath(str) {
  return path.join(__dirname, '..', 'cra-template-qlik-enigma', str)
}

async function copyToTemplate(cb) {
  const copyToTemplateFolder = filename => fs.copy(appPath(filename), templatePath(path.join('template', filename)))
  
  await copyToTemplateFolder('src')
  await copyToTemplateFolder('public')
  await copyToTemplateFolder('jsconfig.json')
  await fs.copy(appPath('.gitignore'), templatePath(path.join('template', 'gitignore')))

  const {dependencies} = await fs.readJSON(appPath('package.json'))

  await fs.writeJSON(templatePath('template.json'), { dependencies })

  let version
  try {
    const data = await fs.readJSON(templatePath('package.json'))
    version = data.version
  }
  catch(err) {
    version = '0.0.1'
  }
  version = semver.inc(version, 'minor')

  await fs.writeJSON(templatePath('package.json'), {
    "name": "cra-template-qlik-enigma",
    "version": version,
    "description": "A create-react-app template to include boilerplate qlik business logic and some customisable charts",
    "main": "template.json",
    "author": "Cameron Nimmo",
    "license": "ISC"
  })
}

async function publishTemplate(cb) {
  await execa.command('npm publish', {
    cwd: path.join(__dirname, '..', 'cra-template-qlik-enigma')
  })
}

exports.template = gulp.series(
  copyToTemplate,
  publishTemplate
)