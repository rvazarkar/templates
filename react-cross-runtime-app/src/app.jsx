'use strict';

var React = require('react')

var App = React.createClass({
  render() {
    return <div>
      <h1>App</h1>
    </div>
  }
})

React.render(<App/>, document.getElementById('app'))