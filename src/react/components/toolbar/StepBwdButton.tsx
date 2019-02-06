import PropTypes from "prop-types";
import React from "react";
import { Player } from "video-react";

const propTypes = {
  player: PropTypes.object,
  className: PropTypes.string,
};

export interface IStepBwdButtonProps {
  player: Player;
  order: number;
  frameRate: number;
}

export default class StepBwdButton extends React.Component<IStepBwdButtonProps> {
  constructor(props, context) {
    super(props, context);
    this.handleClick = this.handleClick.bind(this);
  }

  public handleClick() {
    console.log("stepBwd");
    const playerState = this.props.player.current.getState().player;
    this.props.player.current.seek(playerState.currentTime - (1 / this.props.frameRate));
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
            "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAABEElEQVQ4jaWUvUoDURCFv7MsS7AIFsGnEB9ExNJa0UIEC7GyErHwOfIUprQSqxRikcpqixRiKSpyj0WC7t7LXZbk3G5+vpmBmStj/mRGwA7wBrwgAk2ZLeAH8R7ZG8/et/0VQri3vRn5BrbHtnfdzqJoAe0KqCRVQNmoNLR9Y/tgGdNSGRsSmcr2taQzoLSdhBRpVhsAHEo6BQa5sC5IAZwAd8BGV63cOCWwtwQMuwDZTmxvA7d9AFmIpDnw3AeQhQBz4Ap4XAcCUAPnwNM6EBBT4AiYrQ5ZgGa2L22/9oJIAiDeSkkT4JjFYSaK96S2PZE0BT4a3QShB8yFpDppNvoKKmAEfCbn/u8H8Z2HrKhf79V68upIpDAAAAAASUVORK5CYII=)",
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
StepBwdButton.propTypes = propTypes;
