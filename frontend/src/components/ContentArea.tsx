import {Layout} from 'antd';
import {ActivityList} from './ActivityList';

const {Content} = Layout;

export function ContentArea() {
  return (
    <Content>
      <ActivityList/>
    </Content>
  );
}