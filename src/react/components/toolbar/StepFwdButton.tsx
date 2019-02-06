import PropTypes from "prop-types";
import React from "react";
import { Player } from "video-react";

const propTypes = {
  player: PropTypes.object,
  className: PropTypes.string,
};

export interface IStepFwdButtonProps {
  player: Player;
  order: number;
  frameRate: number;
}

export default class StepFwdButton extends React.Component<IStepFwdButtonProps> {
  constructor(props, context) {
    super(props, context);
    this.handleClick = this.handleClick.bind(this);
  }

  public handleClick() {
    console.log("stepFwd");
    const playerState = this.props.player.current.getState().player;
    this.props.player.current.seek(playerState.currentTime + (1 / this.props.frameRate));
  }

  public render() {
    // @ts-ignore
    const { player } = this.props;
    const { currentSrc } = player;

    return (
      <a
        ref={(c) => {
          // @ts-ignore
          this.button = c;
        }}
        className="stepFwd video-react-control video-react-button"
        href={currentSrc}
        download
        style={{
          backgroundImage:
            "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAABDklEQVQ4jZ2UrU4DURCFv7PZbDaIhjQ8Bk+CQKIhNRhICKqSIHgOPBZPKkgVoqqqqoKQ1QQq9iC6IbvD/pA9182c+83NnXtHxvzKTIEU8UFdJgGOgSNghShCvrbsE9uPtvMQPyzL8tn2t+1TN3eRNIB2ZvvM9h1mUkulknIgs50RlMaApBS4tp3KmiN20ROVdMRzSZfAOeZP5cGT1HQAPFSep7EQgGkF+urzDkEAJsC97VxSq6HrTqJWkt67kv+BvAJzYDRkCVwB2z5TH2QNXCDeBgq1Q2xvbN8i1kMAaO9OAcwkLQIYSbR1qAGRtAVulOgl+D4lLW3vKk9DCqNg/8Tb/st+TORAEfNNyEj9AITudh25tJAQAAAAAElFTkSuQmCC)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
        // @ts-ignore
        tabIndex="0"
        onClick={this.handleClick}
      />
    );
  }
}
// @ts-ignore
StepFwdButton.propTypes = propTypes;
