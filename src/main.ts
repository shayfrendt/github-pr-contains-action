import * as core from '@actions/core';
const {GitHub, context} = require('@actions/github')
const parse = require('parse-diff')

async function run() {
    try {
        // get information on everything
        const token = core.getInput('github-token', {required: true})
        const github = new GitHub(token, {} )
        const PR_number = context.payload.pull_request.number
        
        // Check if the pull request description contains required string
        const bodyContains = core.getInput('bodyContains')
        if ( bodyContains && context.payload.pull_request.body.includes(bodyContains) ) {
            core.setFailed("The PR description should include " + bodyContains)
        }

	// Check to ensure the pull request description does not contain the specified string
        const bodyDoesNotContain = core.getInput('bodyDoesNotContain')
        if ( bodyDoesNotContain && !context.payload.pull_request.body.includes(bodyDoesNotContain) ) {
            core.setFailed("The PR description should not include " + bodyDoesNotContain);
        }
        
	// Request the pull request diff from the GitHub API
	const diff_url = context.payload.pull_request.diff_url
	const result = await github.request( diff_url )
	const files = parse(result.data)

	// Check if the specified number of files have changed
	const filesChanged = core.getInput('filesChanged')
	if ( filesChanged && files.length != filesChanged ) {
            core.setFailed( "You should change exactly " + filesChanged + " file(s)");
	}

	var changes = ''
	var additions:number = 0
	files.forEach(function(file) {
	    additions += file.additions
            file.chunks.forEach( function ( chunk ) {
		chunk.changes.forEach( function (change ) {
                    if ( change.add ) {
			changes += change.content
                    }
		})
            })
	})

	const diffContains = core.getInput('diffContains')
	if ( diffContains && changes.includes(diffContains) ) {
            core.setFailed( "The pull request diff should contain " + diffContains);
	}
	    
	const diffDoesNotContain = core.getInput('diffDoesNotContain')
	if ( diffDoesNotContain && !changes.includes(diffDoesNotContain) ) {
            core.setFailed( "The pull request diff should not contain " + diffDoesNotContain);
	}  

	const linesChanged = +core.getInput('linesChanged')
	if ( linesChanged && ( additions != linesChanged ) ) {
	    const this_msg = "You should change exactly " + linesChanged + " lines(s) and you have changed " + additions
            core.setFailed( this_msg );
	}

    } catch (error) {
	core.setFailed(error.message);
    }
}

run();

