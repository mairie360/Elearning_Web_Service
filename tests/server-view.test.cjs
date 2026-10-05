const assert = require('node:assert/strict');
const { test } = require('node:test');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');

test('nested child arrays expose the rendered host controls and retain their state', async () => {
  function NestedControls() {
    const [selected, setSelected] = React.useState('first');
    return React.createElement('section', null, [null, ['first', 'second'].map(id =>
      React.createElement('button', {
        key: id, type: 'button', 'aria-pressed': selected === id,
        onClick: () => setSelected(id),
      }, id),
    )]);
  }
  const view = mount(React.createElement(NestedControls));
  try {
    assert.equal(view.hostElements((_props, _text, tag) => tag === 'button').length, 2);
    await view.click('second');
    assert.match(view.html, /aria-pressed="true">second<\/button>/);
    assert.match(view.html, /aria-pressed="false">first<\/button>/);
  } finally { view.unmount(); }
});

test('ordinary nested DTO arrays retain their reference and are not element props', () => {
  const data = [[{ id: 'chapter', contents: [] }]];
  function DataConsumer({ records }) {
    assert.equal(records, data);
    return React.createElement('p', null, records[0][0].id);
  }
  const view = mount(React.createElement(DataConsumer, { records: data }));
  try {
    assert.equal(view.props('DataConsumer').records, data);
    assert.equal(view.text(), 'chapter');
  } finally { view.unmount(); }
});
