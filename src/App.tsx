import { Layout } from './components/Layout';
import { ReactionTest } from './components/ReactionTest';
import { useReactionTime } from './hooks/useReactionTime';

const App = () => {
  const {
    state,
    result,
    isClickable,
    isWaiting,
    isShowingResult,
    isEarlyClick,
    startTest,
    handleClick,
    reset,
  } = useReactionTime();

  return (
    <Layout>
      <ReactionTest
        state={state}
        result={result}
        isClickable={isClickable}
        isWaiting={isWaiting}
        isShowingResult={isShowingResult}
        isEarlyClick={isEarlyClick}
        onStart={startTest}
        onClickArea={handleClick}
        onReset={reset}
      />
    </Layout>
  );
};

export default App;
