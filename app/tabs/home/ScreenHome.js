import { useNavigation, } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';




export default function ScreenHome() {
  const navigation = useNavigation();
  const [monsters, setMonsters] = useState([]);

  const getMonsters = () => {
    const requestOptions = {
      method: "GET",
      redirect: "follow"
    };

    fetch("https://www.dnd5eapi.co/api/2014/monsters/bugbear", requestOptions)
      .then((response) => response.json())
      .then((result) => setMonsters(result))
      .catch((error) => console.error(error));
  }

  useEffect(() => {
    getMonsters();
  })

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>📖 Grimorio</Text>


      <View>
        {
            <Card style={{ margin: 10, padding: 10, width: 150 }}>
              <Card.Cover source={{ uri: `https://www.dnd5eapi.co${monsters.image}`}} />
            </Card>
          
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 10,
    alignItems: 'center',
  },
  a1: { flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  a2: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }
})