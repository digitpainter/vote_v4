import {Layout} from 'antd';
import {useActivity} from '../contexts/ActivityContext';

const {Header} = Layout;

export function HeaderComponent() {
  const {activeActivities} = useActivity();

  return (
    <Header
      className="h-[400px] bg-center w-full flex  justify-center bg-cover
       bg-no-repeat md:bg-[url('/image/mobile_banner.svg')] bg-[url('/image/Banner.svg')] z-10"
    >
      <div className="flex flex-col items-center mt-[80px]">
        <img src="/image/logo.svg" className="w-[256px] h-[68px] mb-6" alt={"NUAA_LOGO"}/>
        <div className="text-white drop-shadow-md max-md:text-[30px] md:text-[48px]
         text-center w-full tracking-wider font-serif font-bold">
          {activeActivities?.length > 0 ? activeActivities[0].title : '活动标题'}
        </div>
      </div>
    </Header>
  );
}