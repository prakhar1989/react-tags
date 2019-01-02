import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import { spy } from 'sinon';
import noop from 'lodash/noop';

import { WithContext as ReactTags } from '../src/components/ReactTags';

import {
  KEYS,
  DEFAULT_PLACEHOLDER,
  DEFAULT_LABEL_FIELD,
} from '../src/components/constants';

/* eslint-disable no-console */

const defaults = {
  tags: [{ id: 'Apple', text: 'Apple' }],
  suggestions: [
    { id: 'Banana', text: 'Banana' },
    { id: 'Apple', text: 'Apple' },
    { id: 'Apricot', text: 'Apricot' },
    { id: 'Pear', text: 'Pear' },
    { id: 'Peach', text: 'Peach' },
  ],
};

const DOWN_ARROW_KEY_CODE = 40;
const ENTER_ARROW_KEY_CODE = 13;

function mockItem(overrides) {
  const props = Object.assign({}, defaults, overrides);
  return <ReactTags {...props} />;
}

describe('Test ReactTags', () => {
  test('should render with expected props', function() {
    const $el = shallow(mockItem());
    const expectedProps = {
      placeholder: DEFAULT_PLACEHOLDER,
      suggestions: [],
      delimiters: [KEYS.ENTER, KEYS.TAB],
      autofocus: true,
      labelField: DEFAULT_LABEL_FIELD,
      inline: true,
      handleDelete: noop,
      handleAddition: noop,
      enableEdit: false,
      onTagUpdate: noop,
      allowDeleteFromEmptyInput: true,
      allowAdditionFromPaste: true,
      resetInputOnDelete: true,
      autocomplete: false,
      readOnly: false,
      allowDragDrop: true,
      ...defaults,
      allowUnique: true,
    };
    expect($el).to.have.length(1);
    expect($el.props().children.props).to.deep.equal(expectedProps);
  });

  test('focus on input by default', () => {
    const $el = mount(mockItem());
    expect(document.activeElement.tagName).to.equal('INPUT');
    expect(document.activeElement.className).to.equal(
      'ReactTags__tagInputField'
    );
    $el.unmount();
  });

  test('test for check for input in enable Editing', () => {
    const $el = mount(mockItem({ enableEdit: true }));
    $el.find('span').simulate('doubleclick');
    expect($el.find('#editingInput').length).to.equal(1);
  });

  test('test for the function onTagUpdate to run', () => {
    const onTagUpdate = spy();
    const $el = mount(mockItem({ enableEdit: true, onTagUpdate: onTagUpdate }));
    $el.find('span').simulate('doubleclick');
    const $input = $el.find('#editingInput');
    $input.simulate('change', { target: { value: 'Austriaasdf' } });
    $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
    expect(onTagUpdate.calledOnce).to.be.true;
  });

  test('should not focus on input if autofocus is false', () => {
    const $el = mount(mockItem({ autofocus: false }));
    expect(document.activeElement.tagName).to.equal('BODY');
    $el.unmount();
  });

  test('should not focus on input if readOnly is true', () => {
    const $el = mount(mockItem({ autofocus: false }));
    expect(document.activeElement.tagName).to.equal('BODY');
    $el.unmount();
  });

  test('shows the classnames of children properly', () => {
    const $el = mount(mockItem());
    expect($el.find('.ReactTags__tags').length).to.equal(1);
    expect($el.find('.ReactTags__selected').length).to.equal(1);
    expect($el.find('.ReactTags__tagInput').length).to.equal(1);
    expect($el.find('.ReactTags__tagInputField').length).to.equal(1);
  });

  test('renders preselected tags properly', () => {
    const $el = mount(mockItem());
    expect($el.text()).to.have.string('Apple');
  });

  test('invokes the onBlur event', () => {
    const handleInputBlur = spy();
    const $el = mount(mockItem());

    // Won't be invoked as there's no `handleInputBlur` event yet.
    $el.find('.ReactTags__tagInputField').simulate('blur');
    expect(handleInputBlur.callCount).to.equal(0);

    // Will be invoked despite the input being empty.
    $el.setProps({ handleInputBlur });
    $el.find('.ReactTags__tagInputField').simulate('blur');
    expect(handleInputBlur.callCount).to.equal(1);
    expect(handleInputBlur.calledWith('')).to.be.true;
    expect($el.find('.ReactTags__tagInputField').get(0).value).to.be.undefined;
  });

  test('invokes the onFocus event', () => {
    const handleInputFocus = spy();
    const $el = mount(mockItem({ inputValue: 'Example' }));

    $el.setProps({ handleInputFocus });
    $el.find('.ReactTags__tagInputField').simulate('focus');
    expect(handleInputFocus.callCount).to.equal(1);
    expect(handleInputFocus.calledWith('Example')).to.be.true;
  });

  test('invokes the onBlur event when input has value', () => {
    const handleInputBlur = spy();
    const $el = mount(mockItem({ inputValue: 'Example' }));

    // Will also be invoked for when the input has a value.
    $el.setProps({ handleInputBlur });
    $el.find('.ReactTags__tagInputField').simulate('blur');
    expect(handleInputBlur.callCount).to.equal(1);
    expect(handleInputBlur.calledWith('Example')).to.be.true;
    expect($el.find('.ReactTags__tagInputField').get(0).value).to.be.undefined;
  });

  describe('tests handlePaste', () => {
    test('should not add new tag when allowAdditionFromPaste is false', () => {
      const actual = [];
      const $el = mount(
        mockItem({
          allowAdditionFromPaste: false,
          handleAddition(tag) {
            actual.push(tag);
          },
        })
      );

      const $input = $el.find('.ReactTags__tagInputField');

      $input.simulate('paste', {
        clipboardData: {
          getData: () => 'Banana',
        },
      });

      expect(actual).to.have.length(0);
      expect(actual).to.not.have.members(['Banana']);
    });

    test('should split the clipboard on delimiters', () => {
      const Keys = {
        TAB: 9,
        SPACE: 32,
        COMMA: 188,
      };

      const tags = [];
      const $el = mount(
        mockItem({
          delimiters: [Keys.TAB, Keys.SPACE, Keys.COMMA],
          handleAddition(tag) {
            tags.push(tag);
          },
          tags,
        })
      );

      const $input = $el.find('.ReactTags__tagInputField');

      $input.simulate('paste', {
        clipboardData: {
          getData: () =>
            'Banana,Apple,Apricot\nOrange Blueberry,Pear,Peach\tKiwi',
        },
      });

      const expected = [
        'Banana',
        'Apple',
        'Apricot\nOrange',
        'Blueberry',
        'Pear',
        'Peach',
        'Kiwi',
      ].map((value) => ({ id: value, text: value }));

      expect(tags).to.deep.have.same.members(expected);
    });

    test('should not allow duplicate tags', () => {
      const Keys = {
        TAB: 9,
        SPACE: 32,
        COMMA: 188,
      };

      const tags = [...defaults.tags];
      const $el = mount(
        mockItem({
          delimiters: [Keys.TAB, Keys.SPACE, Keys.COMMA],
          handleAddition(tag) {
            tags.push(tag);
          },
          tags,
        })
      );

      const $input = $el.find('.ReactTags__tagInputField');

      $input.simulate('paste', {
        clipboardData: {
          getData: () => 'Banana,Apple,Banana',
        },
      });

      // Note that 'Apple' and 'Banana' are only included once in the expected list
      const expected = ['Apple', 'Banana'].map((value) => ({
        id: value,
        text: value,
      }));

      expect(tags).to.deep.have.same.members(expected);
    });

    test('should allow pasting text only up to maxLength characters', () => {
      const tags = [];
      const maxLength = 5;
      const inputValue = 'Thimbleberry';

      const $el = mount(
        mockItem({
          handleAddition(tag) {
            tags.push(tag);
          },
          maxLength,
        })
      );

      const $input = $el.find('.ReactTags__tagInputField');

      $input.simulate('paste', {
        clipboardData: {
          getData: () => inputValue,
        },
      });

      const clipboardText = inputValue.substr(0, maxLength);
      const expected = [clipboardText].map((value) => ({
        id: value,
        text: value,
      }));
      expect(tags).to.deep.equal(expected);
    });
  });

  test('should not allow duplicate tags', () => {
    const actual = [];
    const $el = mount(
      mockItem({
        handleAddition(tag) {
          actual.push(tag);
        },
      })
    );

    expect($el.instance().props.tags).to.have.deep.members(defaults.tags);
    const $input = $el.find('.ReactTags__tagInputField');
    $input.simulate('change', { target: { value: 'Apple' } });

    $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
    expect(actual).to.have.length(0);
  });

  test('should not add empty tag when down arrow is clicked followed by enter key', () => {
    const actual = [];
    const $el = mount(
      mockItem({
        handleAddition(tag) {
          actual.push(tag);
        },
        suggestions: [],
      })
    );

    expect($el.instance().props.tags).to.have.members(defaults.tags);

    const $input = $el.find('.ReactTags__tagInputField');
    $input.simulate('keyDown', { keyCode: DOWN_ARROW_KEY_CODE });
    $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
    expect(actual).to.have.length(0);
  });

  // this test will fail if console.error occurs
  test('should not set any property of this.textInput when readOnly', () => {
    console.error = jest.fn((error) => {
      throw error;
    });

    const $el = mount(mockItem({ readOnly: true, resetInputOnDelete: false }));
    const $tag = $el.find('.ReactTags__tag');
    $tag.simulate('click');
  });

  test('should fail the test if two tags have same key, issue #110', () => {
    console.warn = jest.fn(() => {
      throw 'Error';
    });

    let modifiedTags = [
      ...defaults.tags,
      { id: 'NewYork', text: 'NewYork' },
      { id: 'Austria', text: 'Austria' },
    ];
    const $el = mount(
      mockItem({
        tags: modifiedTags,
        handleDelete: (i) => {
          modifiedTags = modifiedTags.filter((tag, index) => index !== i);
        },
      })
    );
    //remove Apple
    $el
      .find('.ReactTags__remove')
      .at(0)
      .simulate('click');
    //remove NewYork
    $el
      .find('.ReactTags__remove')
      .at(1)
      .simulate('click');
    $el.setProps({ tags: modifiedTags });
    const $input = $el.find('.ReactTags__tagInputField');
    $input.simulate('change', { target: { value: 'Hello' } });
    $input.simulate('keyDown', { keyCode: DOWN_ARROW_KEY_CODE });
  });

  describe('render tags correctly when html passed in  text attribute, fix #267', () => {
    let modifiedTags = [];
    let handleAddition;
    let actual;
    beforeEach(() => {
      actual = [];
      modifiedTags = [
        ...defaults.tags,
        { id: '1', text: <span style={{ color: 'red' }}> NewYork</span> },
        { id: '2', text: <span style={{ color: 'blue' }}> Austria</span> },
      ];
      handleAddition = ({ id, text }) => {
        actual.push({
          id,
          text: <span style={{ color: 'yellow' }}>{text}</span>,
        });
      };
    });
    test('should render tags correctly', () => {
      const $el = mount(
        mockItem({
          tags: modifiedTags,
        })
      );
      expect($el.instance().props.tags).to.have.members(modifiedTags);
    });

    test('allow adding tag which is not in the list', () => {
      const $el = mount(
        mockItem({
          tags: modifiedTags,
          handleAddition,
        })
      );
      const $input = $el.find('.ReactTags__tagInputField');
      $input.simulate('change', { target: { value: 'Custom tag' } });

      $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
      expect(actual).to.have.length(1);
      expect(React.isValidElement(actual[0].text)).to.be.true;
    });

    test('should not allow duplicate tags', () => {
      const actual = [];
      const $el = mount(
        mockItem({
          tags: modifiedTags,
          handleAddition,
        })
      );
      const $input = $el.find('.ReactTags__tagInputField');
      $input.simulate('change', { target: { value: 'Austria' } });

      $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
      expect(actual).to.have.length(0);
    });
  });
  describe('autocomplete/suggestions filtering', () => {
    test('updates suggestions state as expected based on default filter logic', () => {
      const $el = mount(mockItem());
      const ReactTagsInstance = $el.instance().getDecoratedComponentInstance();
      const $input = $el.find('.ReactTags__tagInputField');

      expect(ReactTagsInstance.state.suggestions).to.have.members(
        defaults.suggestions
      );

      $input.simulate('change', { target: { value: 'ea' } });
      expect(ReactTagsInstance.state.suggestions).to.have.members([]);

      $input.simulate('change', { target: { value: 'ap' } });
      expect(ReactTagsInstance.state.suggestions).to.have.deep.members([
        { id: 'Apple', text: 'Apple' },
        { id: 'Apricot', text: 'Apricot' },
      ]);
    });

    test('updates suggestions state as expected based on custom filter logic', () => {
      const $el = mount(
        mockItem({
          handleFilterSuggestions: (query, suggestions) => {
            return suggestions.filter((suggestion) => {
              return (
                suggestion.text.toLowerCase().indexOf(query.toLowerCase()) >= 0
              );
            });
          },
        })
      );
      const ReactTagsInstance = $el.instance().getDecoratedComponentInstance();
      const $input = $el.find('.ReactTags__tagInputField');

      expect(ReactTagsInstance.state.suggestions).to.have.members(
        defaults.suggestions
      );

      $input.simulate('change', { target: { value: 'Ea' } });
      expect(ReactTagsInstance.state.suggestions).to.have.deep.members([
        { id: 'Pear', text: 'Pear' },
        { id: 'Peach', text: 'Peach' },
      ]);

      $input.simulate('change', { target: { value: 'ap' } });
      expect(ReactTagsInstance.state.suggestions).to.have.deep.members([
        { id: 'Apple', text: 'Apple' },
        { id: 'Apricot', text: 'Apricot' },
      ]);
    });

    test('updates selectedIndex state as expected based on changing suggestions', () => {
      const $el = mount(
        mockItem({
          autocomplete: true,
          handleFilterSuggestions: (query, suggestions) => {
            return suggestions.filter((suggestion) => {
              return (
                suggestion.text.toLowerCase().indexOf(query.toLowerCase()) >= 0
              );
            });
          },
        })
      );
      const ReactTagsInstance = $el.instance().getDecoratedComponentInstance();
      const $input = $el.find('.ReactTags__tagInputField');

      expect(ReactTagsInstance.state.suggestions).to.have.deep.members(
        defaults.suggestions
      );

      $input.simulate('change', { target: { value: 'Ea' } });
      $input.simulate('focus');
      $input.simulate('keyDown', { keyCode: DOWN_ARROW_KEY_CODE });
      $input.simulate('keyDown', { keyCode: DOWN_ARROW_KEY_CODE });
      expect(ReactTagsInstance.state.suggestions).to.have.deep.members([
        { id: 'Pear', text: 'Pear' },
        { id: 'Peach', text: 'Peach' },
      ]);
      expect(ReactTagsInstance.state.selectedIndex).to.equal(1);
      $input.simulate('change', { target: { value: 'Each' } });
      expect(ReactTagsInstance.state.suggestions).to.have.deep.members([
        { id: 'Peach', text: 'Peach' },
      ]);
      expect(ReactTagsInstance.state.selectedIndex).to.equal(0);
    });

    test('selects the correct suggestion using the keyboard when minQueryLength is set to 0', () => {
      let actual = [];
      const $el = mount(
        mockItem({
          query: '',
          minQueryLength: 0,
          handleAddition(tag) {
            actual.push(tag);
          },
        })
      );
      const $input = $el.find('.ReactTags__tagInputField');

      $input.simulate('keyDown', { keyCode: DOWN_ARROW_KEY_CODE });
      $input.simulate('keyDown', { keyCode: DOWN_ARROW_KEY_CODE });
      $input.simulate('keyDown', { keyCode: DOWN_ARROW_KEY_CODE });
      $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
      expect(actual).to.have.deep.members([{ id: 'Apricot', text: 'Apricot' }]);

      $el.unmount();
    });

    test('handles addition when using default suggestions filter', () => {
      let actual = [];
      const $el = mount(
        mockItem({
          autocomplete: true,
          handleAddition(tag) {
            actual.push(tag);
          },
        })
      );
      const $input = $el.find('.ReactTags__tagInputField');

      $input.simulate('change', { target: { value: 'Ea' } });
      $input.simulate('focus');
      $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
      expect(actual).to.have.deep.members([{ id: 'Ea', text: 'Ea' }]);
    });
    test('should add tag with custom label field and default suggestion filter', () => {
      const labelField = 'name';
      const mapper = (data) => ({ id: data.id, name: data.text });
      const tags = defaults.tags.map(mapper);
      const suggestions = defaults.suggestions.map(mapper);

      let actual = [];
      const $el = mount(
        mockItem({
          autocomplete: true,
          handleAddition(tag) {
            actual.push(tag);
          },
          labelField,
          tags,
          suggestions,
        })
      );
      const $input = $el.find('.ReactTags__tagInputField');
      $input.simulate('change', { target: { value: 'Ea' } });
      $input.simulate('focus');
      $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
      expect(actual).to.have.deep.members([{ id: 'Ea', name: 'Ea' }]);
    });
    test('should select the correct suggestion using the keyboard when label is custom', () => {
      const labelField = 'name';
      const mapper = (data) => ({ id: data.id, name: data.text });
      let actual = [];
      const suggestions = defaults.suggestions.map(mapper);

      const $el = mount(
        mockItem({
          labelField,
          tags: actual,
          suggestions,
          handleAddition(tag) {
            actual.push(tag);
          },
        })
      );

      const $input = $el.find('.ReactTags__tagInputField');

      $input.simulate('change', { target: { value: 'Ap' } });
      $input.simulate('keyDown', { keyCode: DOWN_ARROW_KEY_CODE });
      $input.simulate('keyDown', { keyCode: DOWN_ARROW_KEY_CODE });
      $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
      expect(actual).to.have.deep.members([
        { id: 'Apricot', [labelField]: 'Apricot' },
      ]);
      $el.unmount();
    });
  });
});

test('should render default tags with custom label field', () => {
  const labelField = 'name';
  const mapper = (data) => ({ id: data.id, name: data.text });
  const tags = defaults.tags.map(mapper);
  const suggestions = defaults.suggestions.map(mapper);

  const expectedText = tags[0][labelField];

  const props = {
    labelField,
    tags,
    suggestions,
  };

  const $el = mount(mockItem(props));
  expect($el.text().slice(0, -1)).to.equal(expectedText);
  $el.unmount();
});

test('should allow duplicate tags when allowUnique is false', () => {
  const actual = [];
  const $el = mount(
    mockItem({
      handleAddition(tag) {
        actual.push(tag);
      },
      allowUnique: false,
    })
  );

  expect($el.instance().props.tags).to.have.deep.members(defaults.tags);
  const $input = $el.find('.ReactTags__tagInputField');
  $input.simulate('change', { target: { value: 'Apple' } });
  $input.simulate('keyDown', { keyCode: ENTER_ARROW_KEY_CODE });
  expect(actual).to.have.deep.members([
    {
      id: 'Apple',
      text: 'Apple',
    },
  ]);
});
