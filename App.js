// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.js to start working on your app!</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

import { FormRenderer } from 'form0-react-native';
import schema from './form.schema.js'; // make sure this file exists in root

export default function App() {
  return (
    <FormRenderer
      schema={schema}
      initialValues={{ age: 21, first_name: 'Alice' }}
      onSubmit={(values) => console.log('📤 Submitted:', values)}
      debug
    />
  );
}
