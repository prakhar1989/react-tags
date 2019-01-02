import React, { Component } from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import flow from 'lodash/flow';
import ClassNames from 'classnames';
import {
  tagSource,
  tagTarget,
  dragSource,
  dropCollect,
} from './DragAndDropHelper';
import { canDrag } from './utils';
import noop from 'lodash/noop';
import RemoveComponent from './RemoveComponent';

const ItemTypes = { TAG: 'tag' };

class Tag extends Component {
  render() {
    const { props } = this;
    const label = props.tag[props.labelField];
    const {
      connectDragSource,
      isDragging,
      enableEdit,
      connectDropTarget,
      readOnly,
    } = props;

    const tagComponent = (
      <span
        className={ClassNames('tag-wrapper', props.classNames.tag, {'opacity-none' : isDragging}, {'cursor-move': canDrag(props)})}
        onDoubleClick={enableEdit ? props.editTag : noop}
        onClick={enableEdit ? noop : props.onTagClicked}
        onKeyDown={props.onTagClicked}>
        {label}
        <RemoveComponent
          tag={props.tag}
          className={props.classNames.remove}
          removeComponent={props.removeComponent}
          onClick={props.onDelete}
          readOnly={readOnly}
        />
      </span>
    );
    return connectDragSource(connectDropTarget(tagComponent));
  }
}

Tag.propTypes = {
  labelField: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
  tag: PropTypes.object.isRequired,
  moveTag: PropTypes.func,
  removeComponent: PropTypes.func,
  onTagClicked: PropTypes.func,
  classNames: PropTypes.object,
  readOnly: PropTypes.bool,
  connectDragSource: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
};

Tag.defaultProps = {
  labelField: 'text',
  readOnly: false,
};

export default flow(
  DragSource(ItemTypes.TAG, tagSource, dragSource),
  DropTarget(ItemTypes.TAG, tagTarget, dropCollect)
)(Tag);
