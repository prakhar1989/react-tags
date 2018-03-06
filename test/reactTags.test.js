import React from "react";
import { expect } from "chai";
import { mount, shallow } from "enzyme";
import { spy } from "sinon";
import noop from "lodash/noop";
import { WithContext as ReactTags } from "../lib/ReactTags";
import renderer from "react-test-renderer";

const defaults = {
  tags: [{ id: 1, text: "Apple" }],
  suggestions: ["Banana", "Apple", "Apricot", "Pear", "Peach"],
  handleAddition: noop,
  handleDelete: noop,
  handleDrag: noop,
};

const DOWN_ARROW_KEY_CODE = "ArrowDown";
const UP_ARROW_KEY_CODE = "ArrowUp";
const ENTER_ARROW_KEY_CODE = "Enter";

function mockItem(overrides) {
  const props = Object.assign({}, defaults, overrides);
  return <ReactTags {...props} />;
}

test("focus on input by default", () => {
  const $el = mount(mockItem());
  expect(document.activeElement.tagName).to.equal("INPUT");
  expect(document.activeElement.className).to.equal("ReactTags__tagInputField");
  $el.unmount();
});

test("should not focus on input if autofocus is false", () => {
  const $el = mount(mockItem({ autofocus: false }));
  expect(document.activeElement.tagName).to.equal("BODY");
  $el.unmount();
});

test("should not focus on input if readOnly is true", () => {
  const $el = mount(mockItem({ autofocus: false }));
  expect(document.activeElement.tagName).to.equal("BODY");
  $el.unmount();
});

test("shows the classnames of children properly", () => {
  const $el = mount(mockItem());
  expect($el.find(".ReactTags__tags").length).to.equal(1);
  expect($el.find(".ReactTags__selected").length).to.equal(1);
  expect($el.find(".ReactTags__tagInput").length).to.equal(1);
  expect($el.find(".ReactTags__tagInputField").length).to.equal(1);
});

test("renders preselected tags properly", () => {
  const $el = mount(mockItem());
  expect($el.text()).to.have.string("Apple");
});

test("invokes the onBlur event", () => {
  const handleInputBlur = spy();
  const $el = mount(mockItem());

  // Won't be invoked as there's no `handleInputBlur` event yet.
  $el.find(".ReactTags__tagInputField").simulate("blur");
  expect(handleInputBlur.callCount).to.equal(0);

  // Will be invoked despite the input being empty.
  $el.setProps({ handleInputBlur });
  $el.find(".ReactTags__tagInputField").simulate("blur");
  expect(handleInputBlur.callCount).to.equal(1);
  expect(handleInputBlur.calledWith("")).to.be.true;
  expect($el.find(".ReactTags__tagInputField").get(0).value).to.be.undefined;
});

test("invokes the onFocus event", () => {
  const handleInputFocus = spy();
  const $el = mount(mockItem({ inputValue: "Example" }));

  $el.setProps({ handleInputFocus });
  $el.find(".ReactTags__tagInputField").simulate("focus");
  expect(handleInputFocus.callCount).to.equal(1);
  expect(handleInputFocus.calledWith("Example")).to.be.true;
})

test("invokes the onBlur event when input has value", () => {
  const handleInputBlur = spy();
  const $el = mount(mockItem({ inputValue: "Example" }));

  // Will also be invoked for when the input has a value.
  $el.setProps({ handleInputBlur });
  $el.find(".ReactTags__tagInputField").simulate("blur");
  expect(handleInputBlur.callCount).to.equal(1);
  expect(handleInputBlur.calledWith("Example")).to.be.true;
  expect($el.find(".ReactTags__tagInputField").get(0).value).to.be.undefined;
});

test("should not add new tag on paste event", () => {
    const actual = [];
    const $el = mount(
        mockItem({
            allowAdditionFromPaste: false,
            handleAddition(tag) {
                actual.push(tag);
            }
        })
    );

    const ReactTagsInstance = $el.instance().refs.child;
    const $input = $el.find(".ReactTags__tagInputField");

    $input.simulate("paste", {
        clipboardData: {
            getData: () => "Banana"
        },
    });

    expect(actual).to.have.length(0);
    expect(actual).to.not.have.members([
        "Banana"
    ]);
});

test("handles the paste event and splits the clipboard on string delimiters", () => {
  const Keys = {
    TAB: "Tab",
    SPACE: " ",
    COMMA: ",",
  };

  const actual = [];
  const $el = mount(
    mockItem({
      delimiters: [Keys.TAB, Keys.SPACE, Keys.COMMA],
      handleAddition(tag) {
        actual.push(tag);
      },
    })
  );

  const ReactTagsInstance = $el.instance().refs.child;
  const $input = $el.find(".ReactTags__tagInputField");

  $input.simulate("paste", {
    clipboardData: {
      getData: () => "Banana,Apple,Apricot\nOrange Blueberry,Pear,Peach\tKiwi",
    },
  });

  expect(actual).to.have.members([
    "Banana",
    "Apple",
    "Apricot\nOrange",
    "Blueberry",
    "Pear",
    "Peach",
    "Kiwi",
  ]);
});

test("handles the paste event and splits the clipboard on numeric delimiters", () => {
  const Keys = {
    TAB: 9,
    SPACE: 32,
    COMMA: 188,
  };

  const actual = [];
  const $el = mount(
    mockItem({
      delimiters: [Keys.TAB, Keys.SPACE, Keys.COMMA],
      handleAddition(tag) {
        actual.push(tag);
      },
    })
  );

  const ReactTagsInstance = $el.instance().refs.child;
  const $input = $el.find(".ReactTags__tagInputField");

  $input.simulate("paste", {
    clipboardData: {
      getData: () => "Banana,Apple,Apricot\nOrange Blueberry,Pear,Peach\tKiwi",
    },
  });

  expect(actual).to.have.members([
    "Banana",
    "Apple",
    "Apricot\nOrange",
    "Blueberry",
    "Pear",
    "Peach",
    "Kiwi",
  ]);
});

test("the escape key clears suggestions and exits selection mode", () => {
  const EscapeKey = "Escape";
  const $el = mount(mockItem());
  const ReactTagsInstance = $el.instance().getDecoratedComponentInstance();

  expect(ReactTagsInstance.state.suggestions).to.have.members( defaults.suggestions );
  expect(ReactTagsInstance.state.selectedIndex).to.equal(-1);
  expect(ReactTagsInstance.state.selectionMode).to.equal(false);

  $el.find(".ReactTags__tagInputField").simulate('keyDown', {key: EscapeKey});
  expect(ReactTagsInstance.state.suggestions).to.have.members([]);
  expect(ReactTagsInstance.state.selectedIndex).to.equal(-1);
  expect(ReactTagsInstance.state.selectionMode).to.equal(false);
});

test("invokes provided onChange handler", () => {
  const AKey = "a";
  let handleInputChange = spy();
  const $el = mount(mockItem());

  $el.setProps({ handleInputChange });
  expect(handleInputChange.callCount).to.equal(0);

  $el.find(".ReactTags__tagInputField").simulate("change", { target: { value: AKey } });
  expect(handleInputChange.callCount).to.equal(1);
  expect(handleInputChange.calledWith(AKey)).to.be.true;

  $el.find(".ReactTags__tagInputField").simulate("change", { target: { value: AKey } });
  expect(handleInputChange.callCount).to.equal(2);
  expect(handleInputChange.calledWith(AKey)).to.be.true;
});

test("hitting backspace with an empty input will remove the last tag", () => {
  const BackspaceKey = "Backspace";
  let handleDelete = spy();
  const $el = mount(mockItem());
  const $input = $el.find(".ReactTags__tagInputField");

  $el.setProps({ handleDelete });
  expect(handleDelete.callCount).to.equal(0);

  $input.simulate("keyDown", { key: BackspaceKey });
  expect(handleDelete.callCount).to.equal(1);

});

test("prevent backspace removing tags with props.allowDeleteFromEmptyInput set to false", () => {
  const BackspaceKey = "Backspace";
  let handleDelete = spy();
  const $el = mount(mockItem({ allowDeleteFromEmptyInput: false}));
  const $input = $el.find(".ReactTags__tagInputField");

  $el.setProps({ handleDelete });
  expect(handleDelete.callCount).to.equal(0);

  $input.simulate("keyDown", { key: BackspaceKey });
  expect(handleDelete.callCount).to.equal(0);
});

test("string keydown delimiter with some text in the input field adds a new tag", () => {
  const TabKeyStringDelimiter = 9;
  const TabKey = "Tab";
  let handleAddition = spy();
  const $el = mount(mockItem({delimiters: TabKeyStringDelimiter}));
  const $input = $el.find(".ReactTags__tagInputField");

  $el.setProps({ handleAddition });
  expect(handleAddition.callCount).to.equal(0);

  $input.simulate("change", { target: { value: "ap" } });
  $input.simulate("keyDown", { key: TabKey, getModifierState: () => false });
  expect(handleAddition.callCount).to.equal(1);
});

test("numeric keydown delimiter with some text in the input field adds a new tag", () => {
  const TabKeyNumericDelimiter = 9;
  const TabKey = "Tab";
  let handleAddition = spy();
  const $el = mount(mockItem({delimiters: TabKeyNumericDelimiter}));
  const $input = $el.find(".ReactTags__tagInputField");

  $el.setProps({ handleAddition });
  expect(handleAddition.callCount).to.equal(0);

  $input.simulate("change", { target: { value: "ap" } });
  $input.simulate("keyDown", { key: TabKey, getModifierState: () => false });
  expect(handleAddition.callCount).to.equal(1);
});

test("delimiter keydown with some text and an active suggestion adds a new tag", () => {
  const EnterKey = "Enter";
  const DownArrowKey = "ArrowDown";
  let handleAddition = spy();
  const $el = mount(mockItem());
  const $input = $el.find(".ReactTags__tagInputField");

  $el.setProps({ handleAddition });
  expect(handleAddition.callCount).to.equal(0);

  $input.simulate("change", { target: { value: "ap" } });
  $input.simulate("keyDown", { key: DownArrowKey });
  $input.simulate("keyDown", { key: EnterKey, getModifierState: () => false });
  expect(handleAddition.callCount).to.equal(1);
});

test("delimiter keydown with an empty input field doesn't add a new tag", () => {
  const EnterKey = "Enter";
  let handleAddition = spy();
  const $el = mount(mockItem());
  const $input = $el.find(".ReactTags__tagInputField");

  $el.setProps({ handleAddition });
  expect(handleAddition.callCount).to.equal(0);

  $input.simulate("keyDown", { key: EnterKey, getModifierState: () => false });
  expect(handleAddition.callCount).to.equal(0);
});

describe("autocomplete/suggestions filtering", () => {
  test("updates suggestions state as expected based on default filter logic", () => {
    const $el = mount(mockItem());
    const ReactTagsInstance = $el.instance().getDecoratedComponentInstance();
    const $input = $el.find(".ReactTags__tagInputField");

    expect(ReactTagsInstance.state.suggestions).to.have.members(
      defaults.suggestions
    );

    $input.simulate("change", { target: { value: "ea" } });
    expect(ReactTagsInstance.state.suggestions).to.have.members([]);

    $input.simulate("change", { target: { value: "ap" } });
    expect(ReactTagsInstance.state.suggestions).to.have.members([
      "Apple",
      "Apricot",
    ]);
  });

  test("updates suggestions state as expected based on custom filter logic", () => {
    const $el = mount(
      mockItem({
        handleFilterSuggestions: (query, suggestions) => {
          return suggestions.filter(suggestion => {
            return suggestion.toLowerCase().indexOf(query.toLowerCase()) >= 0;
          });
        },
      })
    );
    const ReactTagsInstance = $el.instance().getDecoratedComponentInstance();
    const $input = $el.find(".ReactTags__tagInputField");

    expect(ReactTagsInstance.state.suggestions).to.have.members(
      defaults.suggestions
    );

    $input.simulate("change", { target: { value: "Ea" } });
    expect(ReactTagsInstance.state.suggestions).to.have.members([
      "Pear",
      "Peach",
    ]);

    $input.simulate("change", { target: { value: "ap" } });
    expect(ReactTagsInstance.state.suggestions).to.have.members([
      "Apple",
      "Apricot",
    ]);
  });

  test("updates selectedIndex state as expected based on changing suggestions", () => {
    const $el = mount(
      mockItem({
        autocomplete: true,
        handleFilterSuggestions: (query, suggestions) => {
          return suggestions.filter(suggestion => {
            return suggestion.toLowerCase().indexOf(query.toLowerCase()) >= 0;
          });
        },
      })
    );
    const ReactTagsInstance = $el.instance().getDecoratedComponentInstance();
    const $input = $el.find(".ReactTags__tagInputField");

    expect(ReactTagsInstance.state.suggestions).to.have.members(
      defaults.suggestions
    );

    $input.simulate("change", { target: { value: "Ea" } });
    $input.simulate("focus");
    $input.simulate("keyDown", { key: DOWN_ARROW_KEY_CODE });
    $input.simulate("keyDown", { key: DOWN_ARROW_KEY_CODE });
    expect(ReactTagsInstance.state.suggestions).to.have.members([
      "Pear",
      "Peach",
    ]);
    expect(ReactTagsInstance.state.selectedIndex).to.equal(1);
    $input.simulate("keyDown", { key: UP_ARROW_KEY_CODE });
    expect(ReactTagsInstance.state.selectedIndex).to.equal(0);
    $input.simulate("keyDown", { key: DOWN_ARROW_KEY_CODE });
    expect(ReactTagsInstance.state.selectedIndex).to.equal(1);

    $input.simulate("change", { target: { value: "Each" } });
    expect(ReactTagsInstance.state.suggestions).to.have.members(["Peach"]);
    expect(ReactTagsInstance.state.selectedIndex).to.equal(0);
  });

  test("pressing up key on first suggestion will cycle through to the last ", () => {
    const $el = mount(
      mockItem({
        autocomplete: true,
        handleFilterSuggestions: (query, suggestions) => {
          return suggestions.filter(suggestion => {
            return suggestion.toLowerCase().indexOf(query.toLowerCase()) >= 0;
          });
        },
      })
    );
    const ReactTagsInstance = $el.instance().getDecoratedComponentInstance();
    const $input = $el.find(".ReactTags__tagInputField");

    expect(ReactTagsInstance.state.suggestions).to.have.members(
      defaults.suggestions
    );

    $input.simulate("change", { target: { value: "Ea" } });
    $input.simulate("focus");
    $input.simulate("keyDown", { key: DOWN_ARROW_KEY_CODE });
    $input.simulate("keyDown", { key: DOWN_ARROW_KEY_CODE });
    expect(ReactTagsInstance.state.suggestions).to.have.members([
      "Pear",
      "Peach",
    ]);
    expect(ReactTagsInstance.state.selectedIndex).to.equal(1);
    $input.simulate("keyDown", { key: UP_ARROW_KEY_CODE });
    expect(ReactTagsInstance.state.selectedIndex).to.equal(0);
    $input.simulate("keyDown", { key: UP_ARROW_KEY_CODE });
    expect(ReactTagsInstance.state.selectedIndex).to.equal(1);
  });

  test("selects the correct suggestion using the keyboard when minQueryLength is set to 0", function() {
    let actual = [];
    const $el = mount(
      mockItem({
        query: "",
        minQueryLength: 0,
        handleAddition(tag) {
          actual.push(tag);
        },
      })
    );
    const $input = $el.find(".ReactTags__tagInputField");

    $input.simulate("keyDown", { keyCode: DOWN_ARROW_KEY_CODE });
    $input.simulate("keyDown", { keyCode: DOWN_ARROW_KEY_CODE });
    $input.simulate("keyDown", { keyCode: DOWN_ARROW_KEY_CODE });
    $input.simulate("keyDown", { keyCode: ENTER_ARROW_KEY_CODE });
    expect(actual).to.have.members(["Apricot"]);

    $el.unmount();
  });
});
